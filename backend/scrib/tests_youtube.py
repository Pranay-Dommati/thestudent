"""Tests for the "From YouTube" flow.

Two layers:
* unit tests for the pipeline pieces in ``services/youtube_notes.py`` — URL
  normalisation, pre-flight, sampling, coverage repair, pagination, and the
  outline→topics expansion (all with the AI mocked);
* endpoint tests for the async job + status polling.

The coverage/segmentation tests encode the regressions found by hand-checking
real videos: a 40-minute lecture must not collapse into 4 pages, and a video
whose outline stops halfway must trigger a tail re-watch.
"""

import json
import time
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

# pyrefly: ignore [missing-import]
from .services import youtube_notes as yt
# pyrefly: ignore [missing-import]
from .vertex_ai import VertexRateLimited

User = get_user_model()

ORGANIZE_URL = '/api/scrib/youtube/organize/'
CREATE_ORDER_URL = '/api/scrib/payments/create-order/'
CANONICAL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'


def _meta(**over):
    base = {'exists': True, 'title': 'Real Title', 'privacy': 'public',
            'is_live': False, 'duration_seconds': 600}
    base.update(over)
    return base


DEEP = 'x' * (yt.MIN_SUMMARY_CHARS + 40)   # a summary that passes the depth gate
THIN = 'too short'                          # one that does not


def _segments(n, step=180, teachable=True, start=0, summary=DEEP):
    return json.dumps({'segments': [
        {'start': yt._hms(start + i * step), 'title': f'Segment {i}',
         'summary': summary, 'teachable': teachable}
        for i in range(n)
    ]})


def _covering(n, duration, teachable=True, summary=DEEP):
    """An outline that passes every quality gate for ``duration``.

    Last segment at ~95% of the video, enough segments for the duration, and
    deep-enough summaries — so tests that aren't about outline quality don't
    trip a repair and consume the mock's next side_effect.
    """
    n = max(n, yt._expected_segments(duration))
    step = max(int(duration * 0.95 / max(n - 1, 1)), 1)
    return _segments(n, step=step, teachable=teachable, summary=summary)


def _topics(n, prefix='Topic'):
    return json.dumps({'topics': [
        {'name': f'{prefix} {i}', 'instruction': f'Write about {prefix} {i}.'}
        for i in range(n)
    ]})


class PromptExclusionTests(TestCase):
    """Setup/tooling is taught but never revised — it must not become a topic.

    Regression: a Python course's first page came back as "Installing the Python
    Interpreter", "Setting up PyCharm IDE", "Creating and Running Python Files" —
    all real content, none of it something anyone writes in a revision notebook.
    """

    def _assert_excludes_setup(self, prompt, label):
        low = prompt.lower()
        for phrase in ['revision notebook', 'never revised', 'install', 'ide',
                       'extensions', 'account', 'version-control']:
            self.assertIn(phrase, low, f'{label} lost the "{phrase}" exclusion')

    def test_outline_prompt_excludes_tooling_setup(self):
        self._assert_excludes_setup(yt._build_outline_prompt(2400), 'outline prompt')

    def test_transcript_prompt_excludes_tooling_setup(self):
        self._assert_excludes_setup(
            yt._build_transcript_prompt('x', 10, 'T', 1200), 'transcript prompt')

    def test_expand_prompt_excludes_tooling_setup(self):
        chapters = [{'start_seconds': 0, 'title': 't', 'summary': 's', 'teachable': True}]
        prompt = yt._build_expand_prompt(chapters, 10, 'T', 1, 1).lower()
        self.assertIn('never revise', prompt)
        self.assertIn('ide/editor setup', prompt)

    def test_package_install_that_is_the_lesson_is_kept(self):
        """`pip install qrcode` before showing the API is content, not setup."""
        for prompt in (yt._build_outline_prompt(2400),
                       yt._build_transcript_prompt('x', 10, 'T', 1200)):
            self.assertIn('pip install qrcode', prompt)

    def test_virtual_environments_are_kept(self):
        """venv/pip are language concepts, not tool configuration.

        They sit close to the excluded "PATH/environment-variable configuration"
        clause, so every prompt names them as a keeper explicitly.
        """
        chapters = [{'start_seconds': 0, 'title': 't', 'summary': 's', 'teachable': True}]
        for label, prompt in (
            ('outline', yt._build_outline_prompt(2400)),
            ('transcript', yt._build_transcript_prompt('x', 10, 'T', 1200)),
            ('expand', yt._build_expand_prompt(chapters, 10, 'T', 1, 1)),
        ):
            self.assertIn('irtual environment', prompt,
                          f'{label} prompt no longer keeps virtual environments')


class CacheTestCase(TestCase):
    """TestCase that starts with an empty cache — the transcript cache, the
    in-flight lock and the throttle buckets all share the process-global
    locmem cache in tests, so a stale entry would make cases order-dependent."""

    def setUp(self):
        super().setUp()
        from django.core.cache import cache
        cache.clear()


class NormalizeYouTubeUrlTests(TestCase):
    def test_accepts_common_shapes(self):
        vid = 'dQw4w9WgXcQ'
        for raw in [
            f'https://www.youtube.com/watch?v={vid}',
            f'https://youtube.com/watch?v={vid}&t=42s',
            f'https://m.youtube.com/watch?v={vid}',
            f'https://youtu.be/{vid}',
            f'https://youtu.be/{vid}?si=abc',
            f'https://www.youtube.com/shorts/{vid}',
            f'https://www.youtube.com/live/{vid}',
            f'https://www.youtube.com/embed/{vid}',
            f'youtube.com/watch?v={vid}',
        ]:
            self.assertEqual(yt.normalize_youtube_url(raw), CANONICAL, raw)

    def test_rejects_junk(self):
        for raw in ['', None, 'not a url', 'https://vimeo.com/12345',
                    'https://www.youtube.com/watch?v=tooshort',
                    'https://example.com/watch?v=dQw4w9WgXcQ']:
            self.assertIsNone(yt.normalize_youtube_url(raw))


class DurationAndTimestampTests(TestCase):
    def test_iso8601(self):
        self.assertEqual(yt.iso8601_to_seconds('PT45S'), 45)
        self.assertEqual(yt.iso8601_to_seconds('PT10M'), 600)
        self.assertEqual(yt.iso8601_to_seconds('PT1H23M45S'), 5025)
        self.assertEqual(yt.iso8601_to_seconds('P1DT2H'), 93600)
        self.assertEqual(yt.iso8601_to_seconds(''), 0)
        self.assertEqual(yt.iso8601_to_seconds('garbage'), 0)

    def test_timestamp_parsing(self):
        self.assertEqual(yt._timestamp_to_seconds('0:45'), 45)
        self.assertEqual(yt._timestamp_to_seconds('12:34'), 754)
        self.assertEqual(yt._timestamp_to_seconds('1:02:03'), 3723)
        self.assertEqual(yt._timestamp_to_seconds(754), 754)
        self.assertEqual(yt._timestamp_to_seconds('nonsense'), 0)

    def test_hms(self):
        self.assertEqual(yt._hms(45), '0:45')
        self.assertEqual(yt._hms(754), '12:34')
        self.assertEqual(yt._hms(3723), '1:02:03')


class JsonRepairTests(TestCase):
    """A malformed character must never cost a whole (paid) video pass.

    Regression: a real 53-minute run died on ``Invalid \\escape`` at line 108 —
    the model wrote ``\\d`` inside a summary — throwing away the entire outline.
    """

    def test_invalid_escape_is_repaired(self):
        bad = r'{"segments":[{"start":"0:00","title":"Regex \d+ matching","summary":"s","teachable":true}]}'
        with self.assertRaises(json.JSONDecodeError):
            json.loads(bad)
        parsed = yt._loads_json(bad, 'outline', salvage_key='segments')
        self.assertEqual(parsed['segments'][0]['title'], r'Regex \d+ matching')

    def test_truncated_array_salvages_complete_objects(self):
        truncated = (
            '{"segments":[{"start":"0:00","title":"A","summary":"a","teachable":true},'
            '{"start":"3:00","title":"B","summary":"b","teachable":true},'
            '{"start":"6:00","title":"C","summ'
        )
        parsed = yt._loads_json(truncated, 'outline', salvage_key='segments')
        self.assertEqual([s['title'] for s in parsed['segments']], ['A', 'B'])

    def test_salvage_survives_one_corrupt_object(self):
        mixed = (
            '{"segments":[{"start":"0:00","title":"Good","summary":"a","teachable":true},'
            '{"start":"3:00","title":"Bad","summary":"b",,,},'
            '{"start":"6:00","title":"Also good","summary":"c","teachable":true}]}'
        )
        parsed = yt._loads_json(mixed, 'outline', salvage_key='segments')
        self.assertEqual([s['title'] for s in parsed['segments']], ['Good', 'Also good'])

    def test_braces_inside_strings_do_not_break_the_scan(self):
        tricky = (
            '{"segments":[{"start":"0:00","title":"Dict {key: value} literal",'
            '"summary":"He writes {\\"a\\": 1} on screen","teachable":true},'
            '{"start":"2:00","title":"Second","summary":"s","teachable":true}]} trailing junk {'
        )
        parsed = yt._loads_json(tricky, 'outline', salvage_key='segments')
        self.assertEqual(len(parsed['segments']), 2)
        self.assertEqual(parsed['segments'][0]['title'], 'Dict {key: value} literal')

    def test_code_fences_are_stripped(self):
        fenced = '```json\n{"topics":[{"name":"A","instruction":"i"}]}\n```'
        self.assertEqual(len(yt._loads_json(fenced, 'topics')['topics']), 1)

    def test_hopeless_input_still_raises(self):
        for junk in ['', '   ', 'sorry, I cannot help with that']:
            with self.assertRaises(yt.VideoUnreadable):
                yt._loads_json(junk, 'outline', salvage_key='segments')

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_outline_survives_bad_escape_end_to_end(self, mock_ai):
        mock_ai.return_value = (
            r'{"segments":[{"start":"0:00","title":"Path C:\Users\dev","summary":"s","teachable":true},'
            r'{"start":"9:00","title":"Later","summary":"s","teachable":true}]}'
        )
        segs = yt.extract_outline(CANONICAL, 10 * 60)
        self.assertEqual(len(segs), 2)


class PreflightTests(TestCase):
    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=None)
    def test_no_api_key_returns_empty(self, _m):
        self.assertEqual(yt.preflight(CANONICAL), ('', 0))

    @patch('scrib.services.youtube_notes.fetch_video_meta')
    def test_ok_video_returns_title_and_duration(self, m):
        m.return_value = _meta(title='Real Title', duration_seconds=1800)
        self.assertEqual(yt.preflight(CANONICAL), ('Real Title', 1800))

    @patch('scrib.services.youtube_notes.fetch_video_meta')
    def test_too_long_rejected(self, m):
        m.return_value = _meta(duration_seconds=3 * 3600)
        with self.assertRaises(yt.VideoUnreadable) as ctx:
            yt.preflight(CANONICAL)
        self.assertEqual(ctx.exception.code, 'video_too_long')
        self.assertEqual(ctx.exception.status_code, 400)

    @patch('scrib.services.youtube_notes.fetch_video_meta')
    def test_private_missing_and_live_rejected(self, m):
        for meta, code in [(_meta(privacy='private'), 'video_unreadable'),
                           ({'exists': False}, 'video_unreadable'),
                           (_meta(is_live=True), 'video_unsupported')]:
            m.return_value = meta
            with self.assertRaises(yt.VideoUnreadable) as ctx:
                yt.preflight(CANONICAL)
            self.assertEqual(ctx.exception.code, code)


class SamplingAndTargetTests(TestCase):
    def test_sampling_scales_with_length(self):
        self.assertEqual(yt.sampling_for(10 * 60), (1.0, 'MEDIA_RESOLUTION_MEDIUM'))
        self.assertEqual(yt.sampling_for(35 * 60), (0.5, 'MEDIA_RESOLUTION_MEDIUM'))
        self.assertEqual(yt.sampling_for(55 * 60), (0.5, 'MEDIA_RESOLUTION_MEDIUM'))
        self.assertEqual(yt.sampling_for(0), (0.5, 'MEDIA_RESOLUTION_LOW'))  # unknown

    def test_topic_target_scales_with_duration(self):
        """The core regression: page count must track video length, not stay flat."""
        self.assertEqual(yt.target_topic_count(15 * 60), 9)    # ~3 pages
        self.assertEqual(yt.target_topic_count(40 * 60), 24)   # ~8 pages
        self.assertEqual(yt.target_topic_count(60 * 60), 36)   # ~12 pages
        # Monotonic, and a longer video always earns at least as many topics.
        lengths = [5, 15, 30, 40, 60]
        counts = [yt.target_topic_count(m * 60) for m in lengths]
        self.assertEqual(counts, sorted(counts))

    def test_topic_target_is_bounded(self):
        self.assertGreaterEqual(yt.target_topic_count(30), yt.MIN_TOPICS)
        self.assertLessEqual(yt.target_topic_count(10 * 3600), yt.MAX_PAGES * yt.TOPICS_PER_PAGE)


class PaginateTests(TestCase):
    def _sizes(self, n):
        topics = [{'name': f't{i}', 'instruction': ''} for i in range(n)]
        return [len(p['topics']) for p in yt.paginate(topics)]

    def test_never_leaves_a_lone_topic_on_a_page(self):
        # 7 topics balance to 3/2/2, not 3/3/1 — a 1-topic page still costs a credit.
        self.assertEqual(self._sizes(7), [3, 2, 2])
        self.assertEqual(self._sizes(4), [2, 2])
        self.assertEqual(self._sizes(5), [3, 2])

    def test_exact_multiples_and_edges(self):
        self.assertEqual(self._sizes(6), [3, 3])
        self.assertEqual(self._sizes(1), [1])
        self.assertEqual(self._sizes(0), [])

    def test_all_topics_survive(self):
        for n in range(1, 40):
            self.assertEqual(sum(self._sizes(n)), n)


class AssessOutlineTests(TestCase):
    """The quality gates that make a cheap, non-deterministic model usable."""

    def _segs(self, n, last_at, summary=DEEP):
        step = last_at // max(n - 1, 1)
        return [{'start_seconds': i * step, 'title': f't{i}',
                 'summary': summary, 'teachable': True} for i in range(n)]

    def test_a_good_outline_has_no_problems(self):
        duration = 30 * 60
        score, problems, _ = yt.assess_outline(self._segs(10, int(duration * 0.95)), duration)
        self.assertEqual(problems, [])
        self.assertGreater(score, 0.9)

    def test_flags_short_coverage(self):
        duration = 53 * 60
        _, problems, m = yt.assess_outline(self._segs(13, int(duration * 0.86)), duration)
        self.assertTrue(any('stopped at' in p for p in problems))
        self.assertAlmostEqual(m['coverage'], 0.86, places=1)

    def test_flags_sparse_segmentation(self):
        """Under-segmenting is what fused 'lists, tuples and sets' into one topic."""
        duration = 60 * 60          # expects ~20 segments
        _, problems, _ = yt.assess_outline(self._segs(5, int(duration * 0.95)), duration)
        self.assertTrue(any('only 5 segments' in p for p in problems))

    def test_flags_thin_summaries(self):
        duration = 30 * 60
        _, problems, m = yt.assess_outline(
            self._segs(10, int(duration * 0.95), summary=THIN), duration)
        self.assertTrue(any('averaged only' in p for p in problems))
        self.assertLess(m['avg_summary'], yt.MIN_SUMMARY_CHARS)

    def test_empty_outline_scores_zero(self):
        score, problems, _ = yt.assess_outline([], 600)
        self.assertEqual(score, 0.0)
        self.assertTrue(problems)

    def test_better_outline_scores_higher(self):
        duration = 40 * 60
        good = yt.assess_outline(self._segs(14, int(duration * 0.95)), duration)[0]
        thin = yt.assess_outline(self._segs(14, int(duration * 0.95), summary=THIN), duration)[0]
        sparse = yt.assess_outline(self._segs(4, int(duration * 0.95)), duration)[0]
        short = yt.assess_outline(self._segs(14, int(duration * 0.5)), duration)[0]
        self.assertGreater(good, thin)
        self.assertGreater(good, sparse)
        self.assertGreater(good, short)


class OutlineRetryTests(TestCase):
    """A weak outline must be retried with the specific defect named."""

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_thin_summaries_trigger_a_full_retry(self, mock_ai):
        duration = 30 * 60
        mock_ai.side_effect = [
            _covering(10, duration, summary=THIN),   # covers, but too thin
            _covering(10, duration, summary=DEEP),   # retry is better
        ]
        segs = yt.extract_outline(CANONICAL, duration)
        self.assertEqual(mock_ai.call_count, 2)
        self.assertGreater(len(segs[0]['summary']), yt.MIN_SUMMARY_CHARS)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_retry_prompt_names_the_defect(self, mock_ai):
        duration = 30 * 60
        mock_ai.side_effect = [_covering(10, duration, summary=THIN),
                               _covering(10, duration)]
        yt.extract_outline(CANONICAL, duration)
        retry_prompt = mock_ai.call_args_list[1].args[0]
        self.assertIn('PREVIOUS ATTEMPT', retry_prompt)
        self.assertIn('averaged only', retry_prompt)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_worse_retry_is_discarded(self, mock_ai):
        duration = 30 * 60
        mock_ai.side_effect = [_covering(10, duration, summary=THIN),
                               _covering(2, duration, summary=THIN)]
        segs = yt.extract_outline(CANONICAL, duration)
        self.assertEqual(len(segs), 10, 'should keep the better first attempt')

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_failed_retry_is_not_fatal(self, mock_ai):
        duration = 30 * 60
        mock_ai.side_effect = [_covering(10, duration, summary=THIN), RuntimeError('boom')]
        segs = yt.extract_outline(CANONICAL, duration)
        self.assertEqual(len(segs), 10)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_good_outline_costs_exactly_one_call(self, mock_ai):
        duration = 30 * 60
        mock_ai.return_value = _covering(10, duration)
        yt.extract_outline(CANONICAL, duration)
        self.assertEqual(mock_ai.call_count, 1, 'a good outline must not pay for repairs')

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_repairs_are_bounded(self, mock_ai):
        """Worst case is tail re-watch + one retry — never an unbounded loop."""
        duration = 40 * 60
        mock_ai.return_value = _segments(3, step=60, summary=THIN)  # always terrible
        yt.extract_outline(CANONICAL, duration)
        self.assertLessEqual(mock_ai.call_count, 3)


def _transcript(words=1200):
    return ' '.join(f'word{i}' for i in range(words))


def _transcript_reply(n, usable=True):
    return json.dumps({'usable': usable, 'topics': [
        {'name': f'Concept {i}', 'instruction': f'Explain concept {i} with its example.'}
        for i in range(n)
    ]})


class TranscriptCompletenessTests(CacheTestCase):
    def test_normal_speech_rate_passes(self):
        # ~150 wpm over 10 minutes
        self.assertTrue(yt.transcript_looks_complete(_transcript(1500), 600))

    def test_truncated_transcript_is_rejected(self):
        # 100 words for a 40-minute video = 2.5 wpm
        self.assertFalse(yt.transcript_looks_complete(_transcript(100), 40 * 60))

    def test_empty_is_rejected(self):
        self.assertFalse(yt.transcript_looks_complete('', 600))

    def test_unknown_duration_accepts_any_text(self):
        self.assertTrue(yt.transcript_looks_complete(_transcript(50), 0))


class _FakeResp:
    def __init__(self, status, body):
        self.status_code = status
        self._body = body
        self.text = json.dumps(body) if isinstance(body, dict) else str(body)
        self.ok = 200 <= status < 300
    def json(self):
        return self._body


@override_settings(SUPADATA_API_KEY='')
class FetchTranscriptDirectTests(CacheTestCase):
    """The no-key (direct scrape) path must never raise — every failure -> video."""

    def test_missing_library_or_any_error_returns_none(self):
        with patch('scrib.services.youtube_notes.logger'):
            with patch.dict('sys.modules', {'youtube_transcript_api': None}):
                self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))

    def test_blocked_ip_returns_none(self):
        with patch('youtube_transcript_api.YouTubeTranscriptApi.list',
                   side_effect=RuntimeError('IpBlocked: YouTube is blocking requests')):
            self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))


@override_settings(SUPADATA_API_KEY='test-key', SUPADATA_API_URL='https://api.supadata.ai/v1')
class FetchTranscriptSupadataTests(CacheTestCase):
    """With a key set, fetch_transcript goes through Supadata and never raises."""

    def _get(self, *responses):
        """Patch requests.get to yield the given responses in order."""
        it = iter(responses)
        return patch('requests.get', side_effect=lambda *a, **k: next(it))

    def test_plain_text_success(self):
        body = {'content': 'the whole transcript here', 'lang': 'en',
                'availableLangs': ['en', 'es']}
        with self._get(_FakeResp(200, body)):
            text, lang, gen = yt.fetch_transcript('dQw4w9WgXcQ')
        self.assertEqual(text, 'the whole transcript here')
        self.assertEqual(lang, 'en')
        self.assertIsNone(gen)

    def test_chunk_list_is_stitched(self):
        body = {'content': [{'text': 'hello'}, {'text': 'world'}], 'lang': 'en'}
        with self._get(_FakeResp(200, body)):
            self.assertEqual(yt.fetch_transcript('x' * 11)[0], 'hello world')

    def test_transcript_unavailable_returns_none(self):
        with self._get(_FakeResp(404, {'error': 'transcript-unavailable', 'message': 'no captions'})):
            self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))

    def test_202_job_is_polled_to_completion(self):
        with patch('scrib.services.youtube_notes.time.sleep'):
            with self._get(
                _FakeResp(202, {'jobId': 'job-1'}),
                _FakeResp(200, {'status': 'active'}),
                _FakeResp(200, {'status': 'completed', 'content': 'done', 'lang': 'en'}),
            ):
                self.assertEqual(yt.fetch_transcript('dQw4w9WgXcQ')[0], 'done')

    def test_202_job_that_fails_returns_none(self):
        with patch('scrib.services.youtube_notes.time.sleep'):
            with self._get(
                _FakeResp(202, {'jobId': 'job-1'}),
                _FakeResp(200, {'status': 'failed'}),
            ):
                self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))

    def test_network_error_returns_none(self):
        with patch('requests.get', side_effect=ConnectionError('boom')):
            self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))

    def test_empty_content_returns_none(self):
        with self._get(_FakeResp(200, {'content': '   ', 'lang': 'en'})):
            self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))


class TranscriptProxyConfigTests(CacheTestCase):
    """Which client we build from settings. Unset must stay a plain client so
    local dev and an un-provisioned deploy both keep working."""

    @override_settings(WEBSHARE_PROXY_USERNAME='', WEBSHARE_PROXY_PASSWORD='',
                       TRANSCRIPT_PROXY_URL='')
    def test_no_settings_gives_an_unproxied_client(self):
        self.assertIsNone(yt._transcript_client()._fetcher._http_client.proxies or None)

    @override_settings(WEBSHARE_PROXY_USERNAME='user', WEBSHARE_PROXY_PASSWORD='pw',
                       TRANSCRIPT_PROXY_URL='')
    def test_webshare_credentials_are_used(self):
        proxies = yt._transcript_client()._fetcher._http_client.proxies
        self.assertIn('user', proxies['https'])
        self.assertIn('webshare.io', proxies['https'])

    @override_settings(WEBSHARE_PROXY_USERNAME='', WEBSHARE_PROXY_PASSWORD='',
                       TRANSCRIPT_PROXY_URL='http://u:p@1.2.3.4:8080')
    def test_generic_proxy_url_is_used(self):
        proxies = yt._transcript_client()._fetcher._http_client.proxies
        self.assertEqual(proxies['https'], 'http://u:p@1.2.3.4:8080')

    @override_settings(WEBSHARE_PROXY_USERNAME='user', WEBSHARE_PROXY_PASSWORD='pw',
                       TRANSCRIPT_PROXY_URL='http://u:p@1.2.3.4:8080')
    def test_webshare_wins_over_generic(self):
        proxies = yt._transcript_client()._fetcher._http_client.proxies
        self.assertIn('webshare.io', proxies['https'])


class TranscriptOrganizeTests(CacheTestCase):
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_produces_pages_in_one_call(self, mock_ai):
        mock_ai.return_value = _transcript_reply(12)
        result = yt.organize_from_transcript(_transcript(3000), 'Title', 20 * 60)
        self.assertEqual(mock_ai.call_count, 1, 'transcript path must be a single call')
        self.assertEqual(result['source'], 'transcript')
        self.assertEqual(result['total_pages'], 4)
        self.assertEqual(result['video_title'], 'Title')
        # text-only: no video is ever sent
        self.assertNotIn('youtube_url', mock_ai.call_args.kwargs)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_model_flagging_unusable_raises(self, mock_ai):
        """Garbled captions (e.g. Telugu speech auto-captioned as Hindi)."""
        mock_ai.return_value = _transcript_reply(0, usable=False)
        with self.assertRaises(yt.VideoUnreadable):
            yt.organize_from_transcript(_transcript(3000), 'T', 20 * 60)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_too_few_topics_raises(self, mock_ai):
        mock_ai.return_value = _transcript_reply(2)
        with self.assertRaises(yt.VideoUnreadable):
            yt.organize_from_transcript(_transcript(3000), 'T', 20 * 60)


class HybridRouterTests(CacheTestCase):
    """The router: cheapest viable route first, video as the safety net."""

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    @patch('scrib.services.youtube_notes.fetch_transcript')
    def test_good_transcript_skips_the_video_entirely(self, mock_fetch, mock_ai, mock_video):
        mock_fetch.return_value = (_transcript(3000), 'en', True)
        mock_ai.return_value = _transcript_reply(12)
        result = yt.organize(CANONICAL, 'T', 20 * 60)
        self.assertEqual(result['source'], 'transcript')
        mock_video.assert_not_called()

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.fetch_transcript', return_value=None)
    def test_no_transcript_falls_back_to_video(self, mock_fetch, mock_video):
        mock_video.return_value = {'source': 'video', 'total_pages': 5}
        result = yt.organize(CANONICAL, 'T', 20 * 60)
        self.assertEqual(result['source'], 'video')
        mock_video.assert_called_once()

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    @patch('scrib.services.youtube_notes.fetch_transcript')
    def test_truncated_transcript_falls_back_without_calling_ai(self, mock_fetch, mock_ai, mock_video):
        mock_fetch.return_value = (_transcript(100), 'en', True)   # 2.5 wpm
        mock_video.return_value = {'source': 'video', 'total_pages': 5}
        result = yt.organize(CANONICAL, 'T', 40 * 60)
        self.assertEqual(result['source'], 'video')
        mock_ai.assert_not_called()

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    @patch('scrib.services.youtube_notes.fetch_transcript')
    def test_unusable_captions_fall_back_to_video(self, mock_fetch, mock_ai, mock_video):
        mock_fetch.return_value = (_transcript(3000), 'hi', True)
        mock_ai.return_value = _transcript_reply(0, usable=False)
        mock_video.return_value = {'source': 'video', 'total_pages': 5}
        result = yt.organize(CANONICAL, 'T', 20 * 60)
        self.assertEqual(result['source'], 'video')
        mock_video.assert_called_once()

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai',
           side_effect=RuntimeError('vertex exploded'))
    @patch('scrib.services.youtube_notes.fetch_transcript')
    def test_transcript_path_crash_falls_back_to_video(self, mock_fetch, mock_ai, mock_video):
        mock_fetch.return_value = (_transcript(3000), 'en', True)
        mock_video.return_value = {'source': 'video', 'total_pages': 5}
        self.assertEqual(yt.organize(CANONICAL, 'T', 20 * 60)['source'], 'video')


class RateLimitResilienceTests(CacheTestCase):
    """A busy Vertex must never push a usable transcript onto the video path.

    Regression: a single 429 on the transcript organise call sent the job to the
    video path, which needs ~40x the tokens from the same exhausted per-minute
    quota - so the fallback fed the very exhaustion that caused it, and the next
    request was rate-limited too. Retry instead, and if capacity never comes
    back, ask the user to retry rather than spending 500k tokens on a hiccup.
    """

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    @patch('scrib.services.youtube_notes.fetch_transcript')
    def test_persistent_rate_limit_does_not_touch_the_video_path(
            self, mock_fetch, mock_ai, mock_video):
        mock_fetch.return_value = (_transcript(3000), 'en', True)
        mock_ai.side_effect = VertexRateLimited('429 RESOURCE_EXHAUSTED')

        with self.assertRaises(yt.VideoUnreadable) as cm:
            yt.organize(CANONICAL, 'T', 20 * 60)

        self.assertEqual(cm.exception.code, 'ai_busy')
        self.assertEqual(cm.exception.status_code, 503)
        mock_video.assert_not_called()

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    @patch('scrib.services.youtube_notes.fetch_transcript')
    def test_busy_message_tells_the_user_to_retry(self, mock_fetch, mock_ai, mock_video):
        mock_fetch.return_value = (_transcript(3000), 'en', True)
        mock_ai.side_effect = VertexRateLimited('429')
        with self.assertRaises(yt.VideoUnreadable) as cm:
            yt.organize(CANONICAL, 'T', 20 * 60)
        self.assertIn('busy', cm.exception.message.lower())

    @patch('scrib.services.youtube_notes.organize_from_video')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    @patch('scrib.services.youtube_notes.fetch_transcript')
    def test_a_real_failure_still_falls_back_to_video(self, mock_fetch, mock_ai, mock_video):
        """Only capacity is special-cased - genuine breakage keeps the safety net."""
        mock_fetch.return_value = (_transcript(3000), 'en', True)
        mock_ai.side_effect = RuntimeError('malformed everything')
        mock_video.return_value = {'source': 'video', 'total_pages': 5}
        self.assertEqual(yt.organize(CANONICAL, 'T', 20 * 60)['source'], 'video')
        mock_video.assert_called_once()

    def test_transcript_call_asks_for_a_deeper_retry_budget(self):
        """The cheap path must retry harder than the Vertex default."""
        import inspect
        from scrib.vertex_ai import call_scrib_vertex_ai as real
        default = inspect.signature(real).parameters['max_attempts'].default
        self.assertGreater(yt.TRANSCRIPT_MAX_ATTEMPTS, default)


class VertexRetryTests(TestCase):
    """The retry layer itself: what counts as transient, and what it costs."""

    def _api_error(self, code):
        exc = Exception(str(code) + ' error')
        exc.code = code
        return exc

    def test_rate_limits_and_server_blips_are_retryable(self):
        from scrib.vertex_ai import _is_retryable
        for code in (429, 500, 503, 504):
            self.assertTrue(_is_retryable(self._api_error(code)), code)

    def test_client_errors_are_not_retryable(self):
        from scrib.vertex_ai import _is_retryable
        for code in (400, 401, 403, 404):
            self.assertFalse(_is_retryable(self._api_error(code)), code)

    def test_status_strings_are_recognised_without_a_code(self):
        from scrib.vertex_ai import _is_retryable
        self.assertTrue(_is_retryable(Exception('RESOURCE_EXHAUSTED. quota')))
        self.assertFalse(_is_retryable(Exception('INVALID_ARGUMENT')))

    def test_backoff_grows_and_stays_bounded(self):
        from scrib.vertex_ai import _retry_delay, RETRY_MAX_DELAY_S
        delays = [_retry_delay(i) for i in range(6)]
        self.assertLess(delays[0], delays[3])
        for d in delays:
            self.assertLessEqual(d, RETRY_MAX_DELAY_S * 1.25 + 0.01)

    @patch('scrib.vertex_ai.time.sleep')          # no real waiting in tests
    @patch('scrib.vertex_ai.genai.Client')
    @patch('scrib.vertex_ai._setup_credentials')
    def test_retries_then_succeeds(self, _creds, mock_client, mock_sleep):
        from scrib.vertex_ai import call_scrib_vertex_ai
        ok = type('R', (), {'text': '{"topics": []}'})()
        busy = self._api_error(429)
        mock_client.return_value.models.generate_content.side_effect = [busy, busy, ok]

        seen = []
        out = call_scrib_vertex_ai('p', max_attempts=3, on_retry=lambda a, d: seen.append(a))

        self.assertEqual(out, '{"topics": []}')
        self.assertEqual(len(seen), 2)            # reported both waits to the caller
        self.assertEqual(mock_sleep.call_count, 2)

    @patch('scrib.vertex_ai.time.sleep')
    @patch('scrib.vertex_ai.genai.Client')
    @patch('scrib.vertex_ai._setup_credentials')
    def test_exhausted_retries_raise_rate_limited(self, _creds, mock_client, mock_sleep):
        from scrib.vertex_ai import call_scrib_vertex_ai
        mock_client.return_value.models.generate_content.side_effect = self._api_error(429)
        with self.assertRaises(VertexRateLimited):
            call_scrib_vertex_ai('p', max_attempts=3)
        self.assertEqual(mock_client.return_value.models.generate_content.call_count, 3)

    @patch('scrib.vertex_ai.time.sleep')
    @patch('scrib.vertex_ai.genai.Client')
    @patch('scrib.vertex_ai._setup_credentials')
    def test_non_retryable_raises_immediately(self, _creds, mock_client, mock_sleep):
        from scrib.vertex_ai import call_scrib_vertex_ai
        mock_client.return_value.models.generate_content.side_effect = self._api_error(400)
        with self.assertRaises(Exception):
            call_scrib_vertex_ai('p', max_attempts=5)
        self.assertEqual(mock_client.return_value.models.generate_content.call_count, 1)
        mock_sleep.assert_not_called()


class _NoTranscriptMixin:
    """Force the hybrid router down the video branch.

    Without this the tests would hit YouTube for real transcripts — slow,
    flaky, and not what these tests are about. The transcript branch has its
    own tests below.
    """

    def setUp(self):
        super().setUp()
        from django.core.cache import cache
        cache.clear()
        p = patch('scrib.services.youtube_notes.fetch_transcript', return_value=None)
        p.start()
        self.addCleanup(p.stop)


class ProgressAndBudgetTests(_NoTranscriptMixin, TestCase):
    """Progress reporting is cosmetic and must never be load-bearing.

    Regression: a real job finished its outline (19 segments, 509-char
    summaries) and was then killed by the *progress update* — the DatabaseCache
    write hit a MySQL connection that had gone stale during the 80-second video
    call. The exception unwound the pipeline, and the failure handler's own
    cache write died the same way, so the job published no terminal state at all
    and the browser polled "processing" forever.
    """

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_a_throwing_progress_callback_cannot_kill_the_job(self, mock_ai):
        duration = 20 * 60
        mock_ai.side_effect = [_covering(7, duration), _topics(6)]

        def exploding(stage, message):
            raise RuntimeError('(2006, "Server has gone away")')

        result = yt.organize(CANONICAL, 'T', duration, progress=exploding)
        self.assertEqual(sum(len(p['topics']) for p in result['groups']), 6)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_outline_calls_are_time_bounded(self, mock_ai):
        mock_ai.return_value = _covering(7, 20 * 60)
        yt.extract_outline(CANONICAL, 20 * 60)
        self.assertEqual(
            mock_ai.call_args.kwargs['request_timeout_s'], yt.OUTLINE_CALL_TIMEOUT_S)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_expired_budget_skips_optional_repairs(self, mock_ai):
        """A weak outline past the deadline ships as-is rather than overrunning."""
        duration = 40 * 60
        mock_ai.return_value = _segments(3, step=60, summary=THIN)  # would normally repair
        segs = yt.extract_outline(
            CANONICAL, duration, deadline=time.monotonic() - 1)  # already expired
        self.assertEqual(mock_ai.call_count, 1, 'no repair should run past the deadline')
        self.assertEqual(len(segs), 3)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_budget_still_allows_repairs_when_time_remains(self, mock_ai):
        duration = 40 * 60
        mock_ai.side_effect = [
            _segments(13, step=100),          # dense + deep but stops at 50%
            _segments(5, step=300),           # tail carries it to the end
        ]
        yt.extract_outline(CANONICAL, duration, deadline=time.monotonic() + 300)
        self.assertEqual(mock_ai.call_count, 2, 'tail repair runs, retry is unnecessary')

    def test_backend_budget_fits_inside_the_frontend_poll_window(self):
        """GeneratePage.jsx polls for 12 minutes; the backend must finish first."""
        self.assertLess(yt.TOTAL_BUDGET_S, 12 * 60)
        self.assertLessEqual(yt.OUTLINE_CALL_TIMEOUT_S, yt.TOTAL_BUDGET_S)


class OutlineTests(TestCase):
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_parses_and_sorts_segments(self, mock_ai):
        mock_ai.return_value = json.dumps({'segments': [
            {'start': '5:00', 'title': 'Later', 'summary': 'b', 'teachable': True},
            {'start': '0:30', 'title': 'Earlier', 'summary': 'a', 'teachable': False},
        ]})
        segs = yt.extract_outline(CANONICAL, 320)
        self.assertEqual([s['title'] for s in segs], ['Earlier', 'Later'])
        self.assertEqual([s['start_seconds'] for s in segs], [30, 300])
        self.assertFalse(segs[0]['teachable'])

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_short_coverage_triggers_tail_rewatch(self, mock_ai):
        """A 40-min video whose outline stops at 10 min must be re-watched."""
        duration = 40 * 60
        mock_ai.side_effect = [
            _segments(13, step=100),           # dense + deep, but stops at 20:00 (50%)
            _segments(5, step=300, start=0),   # tail, clip-relative
        ]
        segs = yt.extract_outline(CANONICAL, duration)
        self.assertEqual(mock_ai.call_count, 2, 'only the tail repair should fire')
        # Second call must clip to the tail rather than re-watch everything.
        self.assertGreater(mock_ai.call_args_list[1].kwargs['youtube_start_offset_s'], 0)
        self.assertGreater(segs[-1]['start_seconds'], 9 * 60)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_good_coverage_skips_rewatch(self, mock_ai):
        mock_ai.return_value = _covering(11, 35 * 60)
        yt.extract_outline(CANONICAL, 35 * 60)
        self.assertEqual(mock_ai.call_count, 1)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_86_percent_coverage_still_repairs(self, mock_ai):
        """Measured regression: an 86%-coverage outline dropped 7.5 real minutes."""
        duration = 53 * 60
        mock_ai.side_effect = [
            _segments(13, step=int(0.86 * duration / 12)),  # last at ~86%
            _segments(3, step=120),
        ]
        yt.extract_outline(CANONICAL, duration)
        self.assertEqual(mock_ai.call_count, 2, 'tail re-watch should have fired at 86%')

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_failed_tail_rewatch_is_not_fatal(self, mock_ai):
        mock_ai.side_effect = [_segments(3, step=60), RuntimeError('boom')]
        segs = yt.extract_outline(CANONICAL, 40 * 60)
        self.assertEqual(len(segs), 3)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai', side_effect=RuntimeError('403'))
    def test_video_call_failure_raises(self, _m):
        with self.assertRaises(yt.VideoUnreadable):
            yt.extract_outline(CANONICAL, 600)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai', return_value='not json')
    def test_garbage_raises(self, _m):
        with self.assertRaises(yt.VideoUnreadable):
            yt.extract_outline(CANONICAL, 600)


class ExpandTests(TestCase):
    def _chapters(self, n):
        return [{'start_seconds': i * 180, 'title': f'Seg {i}',
                 'summary': f'Summary {i}', 'teachable': True} for i in range(n)]

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_batches_long_outlines(self, mock_ai):
        mock_ai.return_value = _topics(6)
        yt.expand_topics(self._chapters(20), 30, 'Title')
        # 20 chapters / batch of 8 → 3 calls, none of them carrying video.
        self.assertEqual(mock_ai.call_count, 3)
        for call in mock_ai.call_args_list:
            self.assertNotIn('youtube_url', call.kwargs)

    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_failed_batch_falls_back_to_outline(self, mock_ai):
        mock_ai.side_effect = [_topics(3), RuntimeError('boom')]
        topics = yt.expand_topics(self._chapters(16), 20, 'T')
        names = [t['name'] for t in topics]
        self.assertIn('Topic 0', names)          # batch 1 expanded
        self.assertIn('Seg 8', names)            # batch 2 fell back to titles


class OrganizeTests(_NoTranscriptMixin, TestCase):
    """End-to-end through the VIDEO pipeline with both AI passes mocked."""

    def _run(self, outline, topics, duration=40 * 60):
        with patch('scrib.services.youtube_notes.call_scrib_vertex_ai') as m:
            m.side_effect = [outline] + topics
            return yt.organize(CANONICAL, 'Video Title', duration)

    def test_full_pipeline(self):
        duration = 24 * 60   # 8 expected segments -> exactly one expand batch
        result = self._run(_covering(8, duration), [_topics(12)], duration=duration)
        self.assertEqual(result['video_title'], 'Video Title')
        self.assertEqual(result['segments_found'], 8)
        self.assertEqual(sum(len(p['topics']) for p in result['groups']), 12)
        self.assertEqual(result['total_pages'], 4)
        self.assertEqual(result['credits_required'], result['total_pages'])
        self.assertTrue(all(len(p['topics']) <= yt.TOPICS_PER_PAGE for p in result['groups']))

    def test_non_teachable_segments_are_dropped(self):
        outline = json.dumps({'segments': [
            {'start': '0:00', 'title': 'Like and subscribe', 'summary': DEEP, 'teachable': False},
            {'start': '2:00', 'title': 'Real concept', 'summary': DEEP, 'teachable': True},
            {'start': '5:00', 'title': 'Another real concept', 'summary': DEEP, 'teachable': True},
            {'start': '9:30', 'title': 'Buy my course', 'summary': DEEP, 'teachable': False},
        ]})
        with patch('scrib.services.youtube_notes.call_scrib_vertex_ai') as m:
            m.side_effect = [outline, _topics(4)]
            result = yt.organize(CANONICAL, 'T', 600)
            self.assertEqual(result['segments_found'], 4)
            self.assertEqual(result['segments_used'], 2)
            # The expand prompt must only mention the teachable segment.
            expand_prompt = m.call_args_list[1].args[0]
            self.assertIn('Real concept', expand_prompt)
            self.assertNotIn('Buy my course', expand_prompt)

    def test_all_promo_falls_back_to_using_everything(self):
        outline = _covering(3, 600, teachable=False)
        with patch('scrib.services.youtube_notes.call_scrib_vertex_ai') as m:
            m.side_effect = [outline, _topics(4)]
            result = yt.organize(CANONICAL, 'T', 600)
            self.assertEqual(result['segments_used'], result['segments_found'])

    def test_duplicate_topics_removed(self):
        dupes = json.dumps({'topics': [
            {'name': 'Binary search', 'instruction': 'a'},
            {'name': 'binary  Search!', 'instruction': 'b'},
            {'name': 'Merge sort', 'instruction': 'c'},
        ]})
        result = self._run(_covering(5, 600), [dupes], duration=600)
        names = [t['name'] for p in result['groups'] for t in p['topics']]
        self.assertEqual(names, ['Binary search', 'Merge sort'])

    def test_page_cap_and_overflow(self):
        """A model that over-produces still can't push the pack past 24 pages."""
        with patch('scrib.services.youtube_notes.call_scrib_vertex_ai') as m:
            m.side_effect = [_covering(9, 55 * 60)] + [_topics(80)]
            result = yt.organize(CANONICAL, 'T', 55 * 60)
        self.assertEqual(result['total_pages'], yt.MAX_PAGES)
        self.assertEqual(len(result['groups']), yt.MAX_PAGES)
        self.assertTrue(result['remaining_topics'])

    def test_long_video_yields_more_pages_than_short_one(self):
        """The headline regression: duration must drive page count."""
        short = self._run(_covering(4, 15 * 60), [_topics(9)], duration=15 * 60)
        long_ = self._run(_covering(12, 40 * 60), [_topics(24), _topics(0)], duration=40 * 60)
        self.assertGreater(long_['total_pages'], short['total_pages'])
        self.assertGreaterEqual(long_['total_pages'], 7)


# The organize job writes its result from a background thread; DatabaseCache
# hides cross-connection writes inside the test transaction, so pin an
# in-process cache for the end-to-end polling tests.
@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class YouTubeOrganizeEndpointTests(_NoTranscriptMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def _drive(self, url='https://youtu.be/dQw4w9WgXcQ'):
        """POST then poll the status endpoint until it settles."""
        start = self.client.post(ORGANIZE_URL, {'url': url}, format='json')
        if start.status_code != 202:
            return start
        job_id = start.json()['job_id']
        for _ in range(200):
            res = self.client.get(f'{ORGANIZE_URL}status/{job_id}/')
            if res.json().get('status') != 'processing':
                return res
            time.sleep(0.02)
        self.fail('job never settled')

    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta(title='Sample Lecture'))
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_end_to_end_ready(self, mock_ai, _m):
        mock_ai.side_effect = [_covering(4, 600), _topics(6)]
        res = self._drive()
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['status'], 'ready')
        self.assertEqual(body['video_title'], 'Sample Lecture')
        from scrib.views import PRICE_PER_CREDIT_RUPEES
        self.assertEqual(body['cost_rupees'], body['total_pages'] * PRICE_PER_CREDIT_RUPEES)

    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai', side_effect=RuntimeError('403'))
    def test_end_to_end_failed(self, mock_ai, _m):
        res = self._drive()
        self.assertEqual(res.status_code, 422)
        self.assertEqual(res.json()['status'], 'failed')

    @patch('scrib.services.youtube_notes.fetch_video_meta')
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_preflight_rejection_is_synchronous(self, mock_ai, mock_meta):
        mock_meta.return_value = _meta(duration_seconds=3 * 3600)
        res = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()['code'], 'video_too_long')
        mock_ai.assert_not_called()

    def test_bad_url_is_400(self):
        res = self.client.post(ORGANIZE_URL, {'url': 'https://vimeo.com/1'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_unknown_job_is_404(self):
        res = self.client.get(f'{ORGANIZE_URL}status/deadbeef/')
        self.assertEqual(res.status_code, 404)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=False)
    @patch('scrib.tasks.organize_youtube_task.delay')
    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    def test_dispatches_to_celery_when_a_broker_exists(self, _meta_m, mock_delay):
        """Production must use the worker, not a thread in the web process.

        gunicorn there runs --max-requests 500, so a thread in a recycled worker
        would be killed mid-job and strand it on "processing".
        """
        res = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        self.assertEqual(res.status_code, 202)
        mock_delay.assert_called_once()
        cache_key, url, title, duration, lock_key = mock_delay.call_args.args
        self.assertTrue(cache_key.startswith('scrib_yt_job_'))
        self.assertEqual(url, CANONICAL)
        self.assertTrue(lock_key.startswith('scrib_yt_inflight_'))

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @patch('scrib.tasks.organize_youtube_task.delay')
    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    @patch('scrib.services.youtube_notes.call_scrib_vertex_ai')
    def test_falls_back_to_a_thread_without_a_broker(self, mock_ai, _m, mock_delay):
        mock_ai.side_effect = [_covering(4, 600), _topics(6)]
        res = self._drive()
        self.assertEqual(res.status_code, 200)
        mock_delay.assert_not_called()

    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    def test_processing_response_carries_a_stage_message(self, _m):
        with patch('scrib.services.youtube_notes.call_scrib_vertex_ai', side_effect=lambda *a, **k: time.sleep(2)):
            start = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
            body = self.client.get(f"{ORGANIZE_URL}status/{start.json()['job_id']}/").json()
            self.assertEqual(body['status'], 'processing')
            self.assertTrue(body['message'])


@override_settings(SUPADATA_API_KEY='')
class TranscriptRetryAndTimeoutTests(CacheTestCase):
    @override_settings(WEBSHARE_PROXY_USERNAME='u', WEBSHARE_PROXY_PASSWORD='p')
    def test_webshare_retries_are_capped_low(self):
        cfg = yt._transcript_client()._fetcher._http_client
        # WebshareProxyConfig stores retries_when_blocked; assert it's our low cap
        from youtube_transcript_api.proxies import WebshareProxyConfig
        made = []
        real = WebshareProxyConfig.__init__
        def spy(self, *a, **k):
            made.append(k.get('retries_when_blocked'))
            return real(self, *a, **k)
        with patch.object(WebshareProxyConfig, '__init__', spy):
            yt._transcript_client()
        self.assertEqual(made[-1], yt.TRANSCRIPT_RETRIES_WHEN_BLOCKED)
        self.assertLessEqual(yt.TRANSCRIPT_RETRIES_WHEN_BLOCKED, 3)

    def test_a_slow_fetch_is_abandoned(self):
        with patch.object(yt, 'TRANSCRIPT_HARD_TIMEOUT_S', 0.2),              patch('scrib.services.youtube_notes._fetch_transcript_uncached',
                   side_effect=lambda vid: (time.sleep(5), ('x', 'en', True))[1]):
            self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))


class TranscriptCacheTests(CacheTestCase):
    @override_settings(SUPADATA_API_KEY='')
    def test_positive_result_is_cached_and_reused(self):
        with patch('scrib.services.youtube_notes._fetch_transcript_uncached',
                   return_value=('the transcript', 'en', True)) as m:
            first = yt.fetch_transcript('dQw4w9WgXcQ')
            second = yt.fetch_transcript('dQw4w9WgXcQ')
        self.assertEqual(first, ('the transcript', 'en', True))
        self.assertEqual(second, ('the transcript', 'en', True))
        m.assert_called_once()   # second call served from cache

    @override_settings(SUPADATA_API_KEY='')
    def test_miss_is_cached_briefly(self):
        with patch('scrib.services.youtube_notes._fetch_transcript_uncached',
                   return_value=None) as m:
            self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))
            self.assertIsNone(yt.fetch_transcript('dQw4w9WgXcQ'))
        m.assert_called_once()

    @override_settings(SUPADATA_API_KEY='')
    def test_different_videos_are_cached_separately(self):
        with patch('scrib.services.youtube_notes._fetch_transcript_uncached',
                   side_effect=lambda v: (f'text-{v}', 'en', True)) as m:
            a = yt.fetch_transcript('aaaaaaaaaaa')
            b = yt.fetch_transcript('bbbbbbbbbbb')
        self.assertNotEqual(a, b)
        self.assertEqual(m.call_count, 2)


@override_settings(CELERY_TASK_ALWAYS_EAGER=False)
class OrganizeThrottleTests(_NoTranscriptMixin, TestCase):
    """Guests can't loop the endpoint; each call is a paid job."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def _drop_inflight_lock(self):
        """Free just the one-in-flight lock so the throttle cap is what's tested."""
        from django.core.cache import cache
        cache.delete('scrib_yt_inflight_ip127.0.0.1')

    @patch('scrib.views.AnonRateThrottle.THROTTLE_RATES',
           {'yt_organize_anon': '3/hour', 'yt_organize_anon_day': '5/day',
            'yt_organize_user': '3/hour', 'anon': '1000/min', 'user': '1000/min'})
    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    @patch('scrib.tasks.organize_youtube_task.delay')
    def test_anon_hourly_cap(self, _delay, _meta_m):
        accepted = 0
        for _ in range(6):
            self._drop_inflight_lock()
            r = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
            if r.status_code == 202:
                accepted += 1
            else:
                self.assertEqual(r.status_code, 429)
        self.assertEqual(accepted, 3, 'only the 3/hour allowance should pass')

    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    @patch('scrib.tasks.organize_youtube_task.delay')
    def test_one_job_in_flight_per_ip(self, _delay, _meta_m):
        r1 = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        r2 = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        self.assertEqual(r1.status_code, 202)
        self.assertEqual(r2.status_code, 429)
        self.assertEqual(r2.json()['code'], 'job_in_flight')

    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    @patch('scrib.tasks.organize_youtube_task.delay')
    def test_lock_is_released_when_the_job_settles(self, _delay, _meta_m):
        # eager=False here, and the task .delay is mocked, so the lock would
        # normally stay until TTL — simulate the worker finishing.
        from django.core.cache import cache
        self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        cache.delete('scrib_yt_inflight_ip127.0.0.1')   # what the task's finally does
        r = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        self.assertEqual(r.status_code, 202)

    @patch('scrib.services.youtube_notes.fetch_video_meta', return_value=_meta())
    @patch('scrib.tasks.organize_youtube_task.delay')
    def test_cancel_frees_the_lock_and_marks_the_job_cancelled(self, _delay, _meta_m):
        start = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        job_id = start.json()['job_id']

        # A second organise is blocked while the first is "running".
        blocked = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        self.assertEqual(blocked.status_code, 429)

        cancel = self.client.post(f'{ORGANIZE_URL}cancel/{job_id}/', format='json')
        self.assertEqual(cancel.status_code, 200)

        # The job now reports itself cancelled...
        status = self.client.get(f'{ORGANIZE_URL}status/{job_id}/')
        self.assertEqual(status.json()['code'], 'cancelled')

        # ...and a fresh organise goes through immediately.
        again = self.client.post(ORGANIZE_URL, {'url': 'https://youtu.be/dQw4w9WgXcQ'}, format='json')
        self.assertEqual(again.status_code, 202)

    def test_cancel_of_an_unknown_job_still_clears_a_stranded_lock(self):
        from django.core.cache import cache
        cache.set('scrib_yt_inflight_ip127.0.0.1', '1', 900)
        r = self.client.post(f'{ORGANIZE_URL}cancel/deadbeef/', format='json')
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(cache.get('scrib_yt_inflight_ip127.0.0.1'))


class OrganizeThrottleWiringTests(TestCase):
    def test_the_view_has_all_three_scoped_throttles(self):
        from scrib.views import (YouTubeOrganizeView, _YTOrganizeAnonHourThrottle,
                                 _YTOrganizeAnonDayThrottle, _YTOrganizeUserThrottle)
        classes = set(YouTubeOrganizeView.throttle_classes)
        self.assertEqual(classes, {_YTOrganizeAnonHourThrottle,
                                   _YTOrganizeAnonDayThrottle, _YTOrganizeUserThrottle})

    def test_status_view_is_never_throttled(self):
        from scrib.views import YouTubeOrganizeStatusView
        self.assertEqual(YouTubeOrganizeStatusView.throttle_classes, [])

    def test_user_throttle_skips_anonymous_callers(self):
        from scrib.views import _YTOrganizeUserThrottle
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.models import AnonymousUser
        req = APIRequestFactory().post('/x')
        req.user = AnonymousUser()
        self.assertIsNone(_YTOrganizeUserThrottle().get_cache_key(req, None))


class CustomCreditOrderTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='c@example.com', full_name='Buyer', password='pw12345!'
        )
        self.client.force_authenticate(self.user)

    @patch('scrib.views.create_razorpay_order')
    def test_custom_credits_priced_per_credit(self, mock_order):
        from scrib.views import PRICE_PER_CREDIT_PAISE
        mock_order.return_value = {'id': 'order_test123', 'currency': 'INR', 'key_id': 'rzp_test'}
        res = self.client.post(CREATE_ORDER_URL, {'credits': 7}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()['credits'], 7)
        expected = 7 * PRICE_PER_CREDIT_PAISE
        self.assertEqual(res.json()['amount'], expected)
        self.assertEqual(mock_order.call_args[0][0], expected)

    def test_custom_credit_rate_not_cheaper_than_the_starter_pack(self):
        """An a-la-carte top-up must not undercut the entry pack's unit rate,
        otherwise buying credits one at a time beats buying the pack."""
        from scrib.views import PRICE_PER_CREDIT_PAISE, CREDIT_PACKS
        starter = CREDIT_PACKS['starter']
        starter_rate = starter['amount_paise'] / starter['credits']
        self.assertGreaterEqual(PRICE_PER_CREDIT_PAISE, starter_rate)

    @patch('scrib.views.create_razorpay_order')
    def test_credits_out_of_range_rejected(self, mock_order):
        for bad in [0, -3, 5000]:
            res = self.client.post(CREATE_ORDER_URL, {'credits': bad}, format='json')
            self.assertEqual(res.status_code, 400, bad)
        mock_order.assert_not_called()

    @patch('scrib.views.create_razorpay_order')
    def test_named_pack_still_works(self, mock_order):
        mock_order.return_value = {'id': 'order_x', 'currency': 'INR', 'key_id': 'rzp_test'}
        res = self.client.post(CREATE_ORDER_URL, {'pack': 'starter'}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()['credits'], 10)
