"""Turn a YouTube video into handwritten-note topics.

Two-pass "map then expand" pipeline. A single generation asked to watch an hour
of video *and* decide the topic taxonomy *and* write detailed instructions *and*
emit JSON degrades badly at the tail: measured on real videos it front-loaded
detail into the first ~10 minutes and then either compressed the rest into one
or two topics or dropped it entirely (a 40-minute networking revision video lost
TCP-vs-UDP, DNS, SMTP and the whole flow-control section).

So the work is split:

* **Pass 1 — outline** (video call). Chapter the video: timestamp, title, a
  factual summary, and whether the segment is teachable. Chaptering is a task
  models do reliably, and the result is small enough to verify. If the last
  timestamp doesn't reach the end of the video we re-watch *only the tail*
  (``start_offset``) and merge, rather than paying for the whole video again.
* **Pass 2 — expand** (text-only calls, batched). Turn the outline into topics.
  With no video tokens in play there's no attention budget to run out of, so the
  last chapter gets the same care as the first.

Page/topic counts are anchored to the video's *teachable* duration, so a
40-minute lecture yields ~8 pages rather than the ~4 a free-running summary
produced, while a video that is mostly setup and promo correctly stays small.
"""

import json
import logging
import math
import re
import time
from urllib.parse import urlparse, parse_qs

from django.conf import settings

# pyrefly: ignore [missing-import]
from ..vertex_ai import call_scrib_vertex_ai

logger = logging.getLogger(__name__)

# ── Tunables ────────────────────────────────────────────────────────────────
MAX_VIDEO_SECONDS = 60 * 60      # refuse anything longer, before any AI call
MAX_PAGES = 24                   # matches MAX_PAGES_PER_GENERATION in views.py
TOPICS_PER_PAGE = 3              # summary notes stay compact
SECONDS_PER_TOPIC = 100          # ~1 topic per 100s of teachable content
MIN_TOPICS = 4
OUTLINE_BATCH = 8                # chapters per pass-2 call
# The outline pass is markedly non-deterministic: the same model on the same
# 53-minute video produced 28 segments on one run and 13 on the next, reaching
# 94% and 86% of the duration respectively. At 0.75 neither run triggered a
# repair, so the 86% run silently dropped its last 7.5 minutes — real teachable
# content. Repairing is cheap (we re-watch only the tail), a missed section is
# not, so the bar sits high enough that a merely-adequate outline still gets
# topped up.
COVERAGE_THRESHOLD = 0.90        # last chapter must start past this fraction

# Same model as the rest of Scrib. It is cheap enough (~3x less than the older
# 2.5-flash) that we can afford to *check* its output and pay for a retry when
# it comes back thin, which is a better deal than paying more per call and
# hoping — measured, the run-to-run variance of one model dwarfed the gap
# between models. Both overridable from settings.
OUTLINE_MODEL = getattr(settings, 'SCRIB_YOUTUBE_OUTLINE_MODEL', 'gemini-3.1-flash-lite')
EXPAND_MODEL = getattr(settings, 'SCRIB_YOUTUBE_EXPAND_MODEL', 'gemini-3.1-flash-lite')

# Indexing a video is an extraction task, so a low temperature is the
# conventional choice. Measured on a 53-minute video, sweeping 0.2/0.5/0.7 made
# no difference at all — segment count, coverage and summary length were flat
# across the range — so do not expect tuning this to fix output quality. The
# quality gates below are what actually does that work.
OUTLINE_TEMPERATURE = 0.3
EXPAND_TEMPERATURE = 0.3

# Quality gates on the outline. An outline that is short, sparse or thin starves
# pass 2, which never sees the video and can only write from these summaries.
MIN_SUMMARY_CHARS = 260     # mean chars per segment summary
MIN_SEGMENT_RATIO = 0.6     # segments found vs expected for the duration
SECONDS_PER_SEGMENT = 180   # the "expected segments" yardstick
MAX_OUTLINE_ATTEMPTS = 2    # a full re-watch is the expensive repair; allow one

# Speech runs ~130-160 words/minute. A transcript far below that is truncated or
# partial, so prefer watching the video over writing notes from half of it.
MIN_TRANSCRIPT_WPM = 60

# Webshare residential IPs still catch the occasional block; the library then
# retries, re-downloading the ~1 MB watch page each time. A real test saw one
# video burn 5 minutes / ~30 MB grinding through the default 10 retries. Cap it
# low: 3 blocked IPs in a row = give up to the (unblocked) video path.
TRANSCRIPT_RETRIES_WHEN_BLOCKED = 3
# Hard wall-clock ceiling for a single fetch. Bounds worker-slot occupancy no
# matter how the proxy / library misbehaves; on timeout we fall back to video.
TRANSCRIPT_HARD_TIMEOUT_S = 90
# Viral distribution means the same trending videos are pasted over and over.
# Cache the transcript text so a repeat never touches the proxy at all - the
# single biggest lever on both bandwidth and the retry-storm risk.
TRANSCRIPT_CACHE_TTL_S = 7 * 24 * 3600
# Brief negative cache: stops a caption-less video that's going round on social
# from starting a fresh (paid) video-pipeline job for every viewer, while still
# re-checking soon in case the miss was a transient block.
TRANSCRIPT_NEG_CACHE_TTL_S = 15 * 60

# Wall-clock budget for the whole pipeline. Repairs are optional quality
# improvements, so they only run if there is time left — a caller polling from a
# browser gives up eventually, and shipping a merely-good outline beats shipping
# nothing. Must stay below the frontend's poll timeout.
TOTAL_BUDGET_S = 390
OUTLINE_CALL_TIMEOUT_S = 300   # one hung call must not consume the whole budget

# Constrained decoding: the reply is valid JSON with all fields present by
# construction, which removes the malformed-JSON failure class outright (a real
# run died on a stray "\d" and lost a whole paid video pass). Measured against
# schema-off runs it costs nothing in summary depth, so it is free insurance —
# the repair ladder in _loads_json stays as a second line of defence.
OUTLINE_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'segments': {
            'type': 'ARRAY',
            'items': {
                'type': 'OBJECT',
                'properties': {
                    'start': {'type': 'STRING'},
                    'title': {'type': 'STRING'},
                    'summary': {'type': 'STRING'},
                    'teachable': {'type': 'BOOLEAN'},
                },
                'required': ['start', 'title', 'summary', 'teachable'],
            },
        },
    },
    'required': ['segments'],
}

TOPICS_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'topics': {
            'type': 'ARRAY',
            'items': {
                'type': 'OBJECT',
                'properties': {
                    'name': {'type': 'STRING'},
                    'instruction': {'type': 'STRING'},
                },
                'required': ['name', 'instruction'],
            },
        },
    },
    'required': ['topics'],
}

# Same as TOPICS_SCHEMA plus the model's own verdict on the captions. Word-rate
# checks catch a truncated transcript but not a garbled one (Telugu speech
# auto-captioned as Hindi scores fine on length), so the model gets to say
# "I can't tell what this is about" and send us to the video path.
TRANSCRIPT_SCHEMA = {
    'type': 'OBJECT',
    'properties': {
        'usable': {'type': 'BOOLEAN'},
        'topics': TOPICS_SCHEMA['properties']['topics'],
    },
    'required': ['usable', 'topics'],
}


class VideoUnreadable(Exception):
    """A video that can't be turned into notes — carries a user-facing message."""

    def __init__(self, message, code='video_unreadable', status_code=422):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


# ── URL + metadata ──────────────────────────────────────────────────────────

def normalize_youtube_url(raw):
    """Return a canonical ``https://www.youtube.com/watch?v=<id>`` URL, or None.

    Accepts the shapes users actually paste: watch URLs, youtu.be short links,
    /shorts/, /live/, /embed/, m.youtube.com, and any extra query params.
    """
    if not raw or not isinstance(raw, str):
        return None
    raw = raw.strip()
    if not raw:
        return None
    if '://' not in raw:
        raw = 'https://' + raw

    try:
        parsed = urlparse(raw)
    except ValueError:
        return None

    host = (parsed.netloc or '').lower()
    if host.startswith('www.'):
        host = host[4:]
    if host.startswith('m.'):
        host = host[2:]

    video_id = None
    if host in ('youtube.com', 'youtube-nocookie.com'):
        if parsed.path == '/watch':
            video_id = (parse_qs(parsed.query).get('v') or [None])[0]
        else:
            m = re.match(r'^/(?:shorts|live|embed|v)/([^/?#]+)', parsed.path)
            if m:
                video_id = m.group(1)
    elif host == 'youtu.be':
        video_id = parsed.path.lstrip('/').split('/')[0] or None

    if not video_id or not re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id):
        return None
    return f'https://www.youtube.com/watch?v={video_id}'


def iso8601_to_seconds(text):
    """Parse an ISO-8601 duration like ``PT1H23M45S`` (YouTube's format)."""
    if not text:
        return 0
    m = re.fullmatch(r'P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?', text.strip())
    if not m:
        return 0
    days, hours, minutes, seconds = (int(g) if g else 0 for g in m.groups())
    return days * 86400 + hours * 3600 + minutes * 60 + seconds


def fetch_video_meta(video_id):
    """Metadata via the YouTube Data API, or None when unavailable.

    Returns ``{exists, title, privacy, is_live, duration_seconds}``. None means
    "couldn't check" (no API key, network error) — callers then skip pre-flight
    and let the AI try anyway rather than blocking on our own outage.
    """
    key = getattr(settings, 'YOUTUBE_API_KEY', '')
    if not key:
        return None
    try:
        import requests
        resp = requests.get(
            'https://www.googleapis.com/youtube/v3/videos',
            params={'part': 'contentDetails,snippet,status', 'id': video_id, 'key': key},
            timeout=10,
        )
        if resp.status_code != 200:
            logger.warning('[scrib-yt] meta lookup failed %s: %s', resp.status_code, resp.text[:200])
            return None
        items = resp.json().get('items') or []
        if not items:
            return {'exists': False}
        item = items[0]
        snippet = item.get('snippet') or {}
        return {
            'exists': True,
            'title': snippet.get('title', ''),
            'privacy': (item.get('status') or {}).get('privacyStatus', ''),
            'is_live': snippet.get('liveBroadcastContent', 'none') not in ('none', ''),
            'duration_seconds': iso8601_to_seconds(
                (item.get('contentDetails') or {}).get('duration', '')
            ),
        }
    except Exception as exc:
        logger.warning('[scrib-yt] meta lookup error: %s', exc)
        return None


def preflight(url):
    """Fast synchronous gate. Returns ``(title, duration_seconds)``.

    Raises ``VideoUnreadable`` for missing / private / live / over-length videos
    so the user hears about it in under a second instead of after a video call.
    """
    video_id = url.rsplit('=', 1)[-1]
    meta = fetch_video_meta(video_id)
    if meta is None:
        return '', 0
    if not meta.get('exists'):
        raise VideoUnreadable("We couldn't find this video — it may be private, deleted or region-locked.")
    if meta.get('privacy') not in ('public', 'unlisted'):
        raise VideoUnreadable("This video isn't public. Only public or unlisted videos can be turned into notes.")
    if meta.get('is_live'):
        raise VideoUnreadable(
            "Live streams can't be turned into notes yet — use a finished, uploaded video.",
            code='video_unsupported', status_code=400,
        )
    duration = meta.get('duration_seconds') or 0
    if duration > MAX_VIDEO_SECONDS:
        raise VideoUnreadable(
            f"This video is about {round(duration / 60)} minutes long. "
            f"Please use a video under {MAX_VIDEO_SECONDS // 60} minutes.",
            code='video_too_long', status_code=400,
        )
    return meta.get('title') or '', duration


# ── Small helpers ───────────────────────────────────────────────────────────

def _hms(seconds):
    seconds = max(int(seconds or 0), 0)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f'{h:d}:{m:02d}:{s:02d}' if h else f'{m:d}:{s:02d}'


def _timestamp_to_seconds(value):
    """Accept ``"1:02:03"``, ``"12:34"``, ``"754"`` or a number."""
    if isinstance(value, (int, float)):
        return max(int(value), 0)
    if not isinstance(value, str):
        return 0
    parts = value.strip().split(':')
    try:
        nums = [int(float(p)) for p in parts if p != '']
    except ValueError:
        return 0
    if not nums:
        return 0
    total = 0
    for n in nums:
        total = total * 60 + n
    return max(total, 0)


def _repair_escapes(text):
    r"""Escape stray backslashes that JSON doesn't recognise.

    Observed in the wild: a summary mentioning a regex or a Windows path makes
    the model emit ``\d`` or ``\U``, which is not a legal JSON escape and kills
    the whole response. Only ``" \ / b f n r t u`` are valid after a backslash.
    """
    return re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', text)


def _salvage_objects(text):
    """Pull every complete ``{...}`` out of a broken JSON array.

    A single bad escape or a truncated tail would otherwise throw away a whole
    video pass. Scanning brace-by-brace (string- and escape-aware) recovers the
    objects that *are* intact; for the outline pass the coverage check then
    re-watches whatever the damage cut off.
    """
    start_at = text.find('[')
    if start_at == -1:
        return []
    out, depth, obj_start = [], 0, None
    in_str = esc = False
    for i in range(start_at, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == '{':
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == '}' and depth > 0:
            depth -= 1
            if depth == 0 and obj_start is not None:
                chunk = text[obj_start:i + 1]
                for candidate in (chunk, _repair_escapes(chunk)):
                    try:
                        out.append(json.loads(candidate, strict=False))
                        break
                    except (json.JSONDecodeError, TypeError):
                        continue
                obj_start = None
    return out


def _loads_json(text, what, salvage_key=None):
    """Parse a model JSON response, repairing what can be repaired.

    Tries, in order: as-is, with stray escapes fixed, non-strict, and finally
    salvaging the individual objects out of the array. Losing a paid video pass
    to one malformed character is not an acceptable failure mode.
    """
    if not isinstance(text, str) or not text.strip():
        raise VideoUnreadable(f"We couldn't read this video ({what} was empty). Please try again.")
    text = text.strip()
    if text.startswith('```json'):
        text = text[7:-3].strip()
    elif text.startswith('```'):
        text = text[3:-3].strip()

    for attempt, candidate in (('raw', text), ('escape-repaired', _repair_escapes(text))):
        for strict in (True, False):
            try:
                parsed = json.loads(candidate, strict=strict)
                if attempt != 'raw' or not strict:
                    logger.info('[scrib-yt] %s response parsed after repair (%s, strict=%s)',
                                what, attempt, strict)
                return parsed
            except (json.JSONDecodeError, TypeError):
                continue

    if salvage_key:
        items = _salvage_objects(text)
        if items:
            logger.warning('[scrib-yt] %s response was malformed - salvaged %d item(s)',
                           what, len(items))
            return {salvage_key: items}

    logger.warning('[scrib-yt] unparseable %s response: %.300s', what, text)
    raise VideoUnreadable("We couldn't turn this video into notes. Try a different video.")


def sampling_for(duration_seconds):
    """Pick ``(fps, media_resolution)`` from video length.

    Short videos get denser, higher-resolution sampling so on-screen code and
    diagrams stay legible; long ones are thinned so the request stays well
    inside the context window. Unknown duration → the conservative setting.
    """
    if 0 < duration_seconds <= 25 * 60:
        return 1.0, 'MEDIA_RESOLUTION_MEDIUM'
    if 0 < duration_seconds <= MAX_VIDEO_SECONDS:
        # 60 min at 0.5 fps / medium ≈ 575k tokens — well inside the 1M window,
        # and medium is what keeps on-screen code and diagrams legible.
        return 0.5, 'MEDIA_RESOLUTION_MEDIUM'
    return 0.5, 'MEDIA_RESOLUTION_LOW'


def target_topic_count(teachable_seconds):
    """How many topics a given amount of teachable content deserves.

    Calibrated against hand-checked results: a 15-minute single-concept lecture
    wants ~9 topics (3 pages), a 40-minute revision video ~24 (8 pages), a dense
    1-hour tutorial ~33 (11 pages). Capped so we never exceed MAX_PAGES.
    """
    if teachable_seconds <= 0:
        return MIN_TOPICS * 2
    ideal = round(teachable_seconds / SECONDS_PER_TOPIC)
    return int(max(MIN_TOPICS, min(ideal, MAX_PAGES * TOPICS_PER_PAGE)))


def paginate(topics, per_page=TOPICS_PER_PAGE):
    """Spread topics over pages evenly, never leaving a lone topic on a page.

    ``ceil(n/3)`` pages, balanced — 7 topics become 3/2/2, not 3/3/1. A one-topic
    page still costs a full credit, so it has to be earned.
    """
    topics = list(topics)
    if not topics:
        return []
    page_count = max(1, math.ceil(len(topics) / per_page))
    pages, start = [], 0
    for i in range(page_count):
        # Round up so fuller pages come first: 7 topics → 3/2/2, not 2/2/3.
        size = math.ceil((len(topics) - start) / (page_count - i))
        pages.append({'topics': topics[start:start + size]})
        start += size
    return [p for p in pages if p['topics']]


# ── Pass 1: outline the video ───────────────────────────────────────────────

def _safe_progress(progress):
    """Wrap a caller's progress callback so it can never kill the job.

    A real run died exactly here: the callback wrote to a DatabaseCache whose
    MySQL connection had gone stale during an 80-second video call, and the
    exception unwound the whole pipeline after the outline had already
    succeeded. Progress reporting is cosmetic; it must never be load-bearing.
    """
    def report(stage, message):
        if not progress:
            return
        try:
            progress(stage, message)
        except Exception as exc:
            logger.warning('[scrib-yt] progress callback failed (ignored): %s', exc)
    return report


def _expected_segments(duration_seconds):
    return max(4, round(duration_seconds / SECONDS_PER_SEGMENT)) if duration_seconds else 4


def _build_outline_prompt(duration_seconds, start_offset=0, problems=None):
    total = _hms(duration_seconds)
    minutes = max(round(duration_seconds / 60), 1)
    expected = _expected_segments(duration_seconds)
    clip_note = ''
    if start_offset:
        clip_note = (
            f"\nIMPORTANT: this clip starts at {_hms(start_offset)} of the full video. "
            "Report every timestamp RELATIVE TO THE START OF THIS CLIP (the clip begins at 0:00).\n"
        )
    if problems:
        # Retry: name the exact defect. Generic "try harder" reprompts don't work.
        clip_note += (
            "\nA PREVIOUS ATTEMPT AT THIS TASK WAS REJECTED because: "
            + '; '.join(problems)
            + ".\nFix precisely that this time: go all the way to the end of the video, break it "
            "into more segments, and write substantially longer, more specific summaries.\n"
        )
    return (
        "You are indexing a YouTube video so a student can revise from it later.\n"
        f"Watch the ENTIRE video, from the very beginning to the very end ({total}).\n"
        f"{clip_note}\n"
        "Produce a chronological index of every distinct segment. For each segment give:\n"
        '- "start": when the segment begins, as "MM:SS" or "H:MM:SS".\n'
        '- "title": what that segment covers, naming the specific concept, technique, tool,\n'
        "  formula, worked example or question — not a vague label.\n"
        '- "summary": AT LEAST 3 full sentences (aim for 60-100 words) recording what is actually\n'
        "  said and shown: the definitions, syntax, steps, formulas, the ACTUAL numbers and example\n"
        "  values used, comparisons, gotchas, code written, and the answers to any questions worked\n"
        "  through.\n"
        "  Whoever writes the student's notes reads ONLY your summary — they never see the video.\n"
        "  If a detail is not in your summary it is lost forever. Err on the side of too much.\n"
        "    BAD  (useless downstream): \"He explains how to get random numbers.\"\n"
        "    GOOD (usable downstream):  \"Imports the random module with `import random`, then calls\n"
        "    `random.randint(1, 6)` twice into die1 and die2 - randint is inclusive at both ends, so\n"
        "    1 and 6 can both come up. Prints them with the f-string `print(f'({die1}, {die2})')`.\"\n"
        "- \"teachable\": the test is NOT \"does this teach something\" - it is \"would a student\n"
        "  write this in a revision notebook and be tested on it?\". True only for subject\n"
        "  matter: concepts, definitions, syntax, algorithms, formulas, library calls and\n"
        "  their arguments, worked examples, comparisons, gotchas.\n"
        "  FALSE for TOOLING AND ENVIRONMENT SETUP - taught, but never revised:\n"
        "    - downloading or installing anything (interpreters, compilers, IDEs, editors,\n"
        "      browsers, apps), choosing a version, PATH/environment-variable configuration\n"
        "    - installing or configuring IDE extensions, plugins, themes, icon packs\n"
        "    - editor/IDE productivity features and keyboard shortcuts (multi-cursor,\n"
        "      autocomplete, refactor shortcuts, split panes) - a skill, not subject matter\n"
        "    - creating a project/file/folder in an IDE, and where to click to run code\n"
        "    - signing up for accounts, dashboards or hosting\n"
        "    - setting up a version-control tool (unless version control IS the subject)\n"
        "  FALSE also for: channel/presenter intros, \"in this video\", like/subscribe/bell/\n"
        "  playlist appeals, sponsor reads and ads, plugs for the creator's own notes, cheat\n"
        "  sheets, website, course or Discord, \"links in the description\", giveaways,\n"
        "  comment-section requests, career/monetisation advice, and outros.\n"
        "  Borderline: a package install that IS the lesson (e.g. `pip install qrcode`\n"
        "  right before showing that library's API) stays true - the API is the point.\n\n"
        "  KEEP, though, language/ecosystem concepts that happen to involve a command:\n"
        "  virtual environments and dependency isolation (venv, pip), package managers,\n"
        "  build/run commands that are part of the language. These are examinable.\n\n"
        "COVERAGE RULES — these matter more than brevity:\n"
        f"1. The video runs {minutes} minutes. Your index MUST reach the end: the LAST segment's\n"
        f"   start time must fall within the final 10% of the video (after {_hms(duration_seconds * 0.9)}).\n"
        f"2. Expect roughly one segment per 2-4 minutes, so about {expected} segments here.\n"
        "   Do not stop early. Do not compress long stretches into one segment.\n"
        "3. Never skip a stretch of video. Start times must increase, with no large gaps.\n"
        "4. A segment that covers several distinct ideas (e.g. three collection types, or six\n"
        "   networking devices) must say so explicitly in its summary, listing each one.\n\n"
        "Return ONLY valid JSON, no markdown:\n"
        '{"segments":[{"start":"MM:SS","title":"...","summary":"...","teachable":true}]}\n'
    )


def _parse_segments(payload, offset=0):
    raw = payload.get('segments') if isinstance(payload, dict) else payload
    if not isinstance(raw, list):
        return []
    out = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        title = str(item.get('title') or '').strip()
        summary = str(item.get('summary') or '').strip()
        if not title and not summary:
            continue
        teachable = item.get('teachable')
        out.append({
            'start_seconds': _timestamp_to_seconds(item.get('start')) + offset,
            'title': title[:200],
            'summary': summary[:2000],
            'teachable': True if teachable is None else bool(teachable),
        })
    out.sort(key=lambda s: s['start_seconds'])
    return out


def assess_outline(segments, duration_seconds):
    """Score an outline and name what's wrong with it.

    Three things make an outline unusable downstream, and all three were seen in
    real runs of the same model on the same video:

    * **coverage** - it stopped early, so the tail of the video is simply absent;
    * **density**  - too few segments, so distinct ideas get fused into one
      (this is what turned "lists, tuples and sets" into a single topic);
    * **depth**    - summaries too thin for pass 2, which never sees the video,
      to write a usable instruction from.

    Returns ``(score in 0..1, problems, metrics)``.
    """
    if not segments:
        return 0.0, ['no segments were produced'], {}

    expected = _expected_segments(duration_seconds)
    last = segments[-1]['start_seconds']
    coverage = min(last / duration_seconds, 1.0) if duration_seconds else 1.0
    density = min(len(segments) / expected, 1.0)
    depth = sum(len(s['summary']) for s in segments) / len(segments)

    problems = []
    if coverage < COVERAGE_THRESHOLD:
        problems.append(
            f'it stopped at {_hms(last)} of {_hms(duration_seconds)} '
            f'({coverage:.0%} of the video) instead of running to the end'
        )
    if density < MIN_SEGMENT_RATIO:
        problems.append(
            f'it produced only {len(segments)} segments where about {expected} were expected, '
            'so long stretches were compressed together'
        )
    if depth < MIN_SUMMARY_CHARS:
        problems.append(
            f'the summaries averaged only {depth:.0f} characters, far too short to write '
            'notes from without the video'
        )

    score = (
        0.40 * (coverage / COVERAGE_THRESHOLD if COVERAGE_THRESHOLD else 1.0)
        + 0.25 * density
        + 0.35 * min(depth / MIN_SUMMARY_CHARS, 1.0)
    )
    metrics = {'coverage': coverage, 'segments': len(segments),
               'expected_segments': expected, 'avg_summary': round(depth)}
    return min(score, 1.0), problems, metrics


def extract_outline(url, duration_seconds, progress=None, deadline=None):
    """Pass 1 — chapter the video, then verify the result and repair it.

    The model is markedly non-deterministic here (28 segments one run, 13 the
    next on the same video), so the outline is treated as a proposal to be
    checked rather than an answer to be trusted. Cheap targeted repair first
    (re-watch only the missing tail), then at most one full retry that names the
    specific defect. Whichever attempt scores best is what we keep.
    """
    fps, resolution = sampling_for(duration_seconds)
    report = _safe_progress(progress)
    time_left = (lambda: True) if deadline is None else (lambda: time.monotonic() < deadline)

    def _call(prompt, start_offset=None):
        return call_scrib_vertex_ai(
            prompt,
            response_mime_type='application/json',
            response_schema=OUTLINE_SCHEMA,
            temperature=OUTLINE_TEMPERATURE,
            youtube_url=url,
            youtube_fps=fps,
            youtube_media_resolution=resolution,
            youtube_start_offset_s=start_offset,
            model=OUTLINE_MODEL,
            request_timeout_s=OUTLINE_CALL_TIMEOUT_S,
        )

    def _attempt(problems=None):
        text = _call(_build_outline_prompt(duration_seconds, problems=problems))
        return _parse_segments(_loads_json(text, 'outline', salvage_key='segments'))

    try:
        segments = _attempt()
    except VideoUnreadable:
        raise
    except Exception as exc:
        logger.error('[scrib-yt] outline call failed for %s: %s', url, exc)
        raise VideoUnreadable(
            "We couldn't process this video. YouTube may be blocking access to it — "
            "try again, or use a different video."
        )
    if not segments:
        raise VideoUnreadable("This video didn't produce any notes. Try a different video.")

    best = segments
    best_score, problems, metrics = assess_outline(segments, duration_seconds)
    logger.info('[scrib-yt] outline attempt 1: score=%.2f %s', best_score, metrics)

    # ── Repair 1: coverage. Re-watch only the missing tail, not the whole video.
    if any('stopped at' in p for p in problems) and time_left():
        last = best[-1]['start_seconds']
        logger.info('[scrib-yt] outline stopped at %s of %s - re-watching the tail',
                    _hms(last), _hms(duration_seconds))
        report('outlining', 'Going back over the rest of the video…')
        try:
            tail_text = _call(
                _build_outline_prompt(duration_seconds - last, start_offset=last),
                start_offset=last,
            )
            tail = _parse_segments(
                _loads_json(tail_text, 'outline tail', salvage_key='segments'), offset=last)
            tail = [s for s in tail if s['start_seconds'] > last]
            if tail:
                best = sorted(best + tail, key=lambda s: s['start_seconds'])
                best_score, problems, metrics = assess_outline(best, duration_seconds)
                logger.info('[scrib-yt] tail pass added %d segment(s); score=%.2f %s',
                            len(tail), best_score, metrics)
        except Exception as exc:
            # A failed repair is never fatal — ship what we already have.
            logger.warning('[scrib-yt] tail re-watch failed: %s', exc)

    # ── Repair 2: still sparse or thin? One full retry naming the defect.
    if problems and MAX_OUTLINE_ATTEMPTS > 1 and time_left():
        logger.info('[scrib-yt] outline still weak (%s) - retrying in full', '; '.join(problems))
        report('outlining', 'Taking a closer second pass over the video…')
        try:
            retry = _attempt(problems=problems)
            retry_score, _, retry_metrics = assess_outline(retry, duration_seconds)
            logger.info('[scrib-yt] outline attempt 2: score=%.2f %s', retry_score, retry_metrics)
            if retry and retry_score > best_score:
                best, best_score = retry, retry_score
                logger.info('[scrib-yt] keeping the retry outline')
        except Exception as exc:
            logger.warning('[scrib-yt] outline retry failed: %s', exc)

    segments = best

    return segments


# ── Pass 2: expand the outline into topics ──────────────────────────────────

def _build_expand_prompt(chapters, target_topics, video_title, part, total_parts):
    part_note = ''
    if total_parts > 1:
        part_note = (
            f"\nThis is part {part} of {total_parts} of the video. Cover ONLY the segments below; "
            "another call handles the rest. Do not add an intro or a recap topic.\n"
        )
    payload = [
        {'at': _hms(c['start_seconds']), 'title': c['title'], 'summary': c['summary']}
        for c in chapters
    ]
    return (
        "Below is a chronological index of a video"
        + (f' titled "{video_title}"' if video_title else '')
        + ", with a factual summary of each segment.\n"
        "Turn it into topics for handwritten revision notes.\n"
        f"{part_note}\n"
        f"Produce about {target_topics} topics (a few more or fewer is fine), in the video's order.\n\n"
        "RULES:\n"
        "1. Each segment becomes 1-3 topics depending on how much it actually covers.\n"
        "2. A segment covering several DISTINCT ideas must be SPLIT into one topic per idea.\n"
        "   Never merge distinct concepts into a single topic: \"lists, tuples and sets\" must\n"
        "   become three topics; \"while and for loops\" must become two; six networking devices\n"
        "   must become several. Merged topics produce useless notes.\n"
        '3. "name": the specific concept, 4-9 words, standalone and understandable out of context.\n'
        "   Name the real subject — \"For loops with range(start, stop, step)\", NOT \"Controlling\n"
        "   loop repetition\". Never generic: no \"Introduction\", \"Overview\", \"Getting started\",\n"
        "   \"Prerequisites\", \"Summary\", \"Recap\", \"Conclusion\".\n"
        '4. "instruction": 2-4 sentences telling the note-writer exactly what to put on the page —\n'
        "   the definition, the syntax, the steps, the formula, the worked example WITH ITS ACTUAL\n"
        "   NUMBERS, the comparison points, the gotcha. Someone who never watched the video must be\n"
        "   able to write the note from this alone. Pull the specifics out of the segment summary.\n"
        "5. Worked examples, solved problems and exam questions are high value — give them their\n"
        "   own topics and keep their real numbers and answers.\n"
        "6. Skip anything a student would never revise from: downloading or installing tools,\n"
        "   IDE/editor setup, extensions, themes, editor shortcuts, creating a project or file, where to click to\n"
        "   run code, account signup, and version-control setup (unless that IS the subject).\n"
        "   A package install that is immediately followed by using that library stays.\n"
        "   Virtual environments, package managers and dependency isolation also stay -\n"
        "   they are language concepts, not tool configuration.\n"
        "7. Use only what is in the summaries below. Do not invent content.\n\n"
        f"Segments:\n{json.dumps(payload, ensure_ascii=False)}\n\n"
        'Return ONLY valid JSON, no markdown: {"topics":[{"name":"...","instruction":"..."}]}\n'
    )


def _parse_topics(payload):
    raw = payload.get('topics') if isinstance(payload, dict) else payload
    if not isinstance(raw, list):
        return []
    out = []
    for item in raw:
        if isinstance(item, dict):
            name = str(item.get('name') or '').strip()
            instruction = str(item.get('instruction') or '').strip()
        else:
            name, instruction = str(item).strip(), ''
        if name:
            out.append({'name': name[:255], 'instruction': instruction[:600]})
    return out


def expand_topics(chapters, target_topics, video_title):
    """Pass 2 — text-only, batched so no single call has to carry the whole video."""
    batches = [chapters[i:i + OUTLINE_BATCH] for i in range(0, len(chapters), OUTLINE_BATCH)]
    total_parts = len(batches)
    topics = []
    for index, batch in enumerate(batches, start=1):
        share = max(2, round(target_topics * len(batch) / max(len(chapters), 1)))
        prompt = _build_expand_prompt(batch, share, video_title, index, total_parts)
        try:
            text = call_scrib_vertex_ai(
                prompt, response_mime_type='application/json',
                response_schema=TOPICS_SCHEMA, temperature=EXPAND_TEMPERATURE,
                model=EXPAND_MODEL, request_timeout_s=180,
            )
            topics.extend(_parse_topics(_loads_json(text, 'topics', salvage_key='topics')))
        except VideoUnreadable:
            raise
        except Exception as exc:
            # One bad batch shouldn't sink the whole video — fall back to the
            # chapter itself so that stretch still appears in the notes.
            logger.warning('[scrib-yt] expand batch %d/%d failed (%s) - using outline titles',
                           index, total_parts, exc)
            topics.extend({'name': c['title'][:255], 'instruction': c['summary'][:600]}
                          for c in batch if c['title'])
    return topics


# ── Assembly ────────────────────────────────────────────────────────────────

def _dedupe(topics):
    seen, out = set(), []
    for t in topics:
        key = re.sub(r'[^a-z0-9]+', '', t['name'].lower())
        if key and key not in seen:
            seen.add(key)
            out.append(t)
    return out


# ── Transcript path (cheap) ─────────────────────────────────────────────────

def _transcript_client():
    """Build the transcript client, routed through a proxy when one is configured.

    YouTube rate-limits transcript fetches per IP hard: a residential laptop was
    blocked after ~12 requests in 40 minutes, so an unproxied server IP is
    blocked essentially at once. Rotating residential proxies are the documented
    workaround. With nothing configured this returns a plain client, which is
    fine — a refusal just routes the job to the video path.
    """
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api.proxies import WebshareProxyConfig, GenericProxyConfig

    user = getattr(settings, 'WEBSHARE_PROXY_USERNAME', '')
    password = getattr(settings, 'WEBSHARE_PROXY_PASSWORD', '')
    if user and password:
        logger.info('[scrib-yt] transcript client: Webshare proxy (user set, %d chars)', len(user))
        return YouTubeTranscriptApi(proxy_config=WebshareProxyConfig(
            proxy_username=user, proxy_password=password,
            retries_when_blocked=TRANSCRIPT_RETRIES_WHEN_BLOCKED))

    generic = getattr(settings, 'TRANSCRIPT_PROXY_URL', '')
    if generic:
        logger.info('[scrib-yt] transcript client: generic proxy')
        return YouTubeTranscriptApi(proxy_config=GenericProxyConfig(
            http_url=generic, https_url=generic))

    logger.info('[scrib-yt] transcript client: no proxy configured - direct IP, likely to be blocked')
    return YouTubeTranscriptApi()


SUPADATA_POLL_ATTEMPTS = 8      # 202 -> poll the job; ~24s ceiling before giving up
SUPADATA_POLL_INTERVAL_S = 3


def _fetch_transcript_supadata(video_id):
    """Fetch via Supadata (managed transcript API). ``(text, lang, None)`` or None.

    ``mode=auto`` = real captions if present, else YouTube's auto-generated ones
    — but NOT Supadata's paid AI transcription (``generate``): a video with no
    captions is cheaper to send down our own Gemini video path. A 202 means the
    job is queued, so poll it briefly then give up to the video path.
    """
    key = getattr(settings, 'SUPADATA_API_KEY', '')
    base = getattr(settings, 'SUPADATA_API_URL', 'https://api.supadata.ai/v1').rstrip('/')
    try:
        import requests
        headers = {'x-api-key': key}
        resp = requests.get(
            f'{base}/transcript',
            params={'url': f'https://www.youtube.com/watch?v={video_id}',
                    'mode': 'auto', 'text': 'true'},
            headers=headers, timeout=45,
        )

        if resp.status_code == 202:
            job_id = (resp.json() or {}).get('jobId')
            if not job_id:
                return None
            for _ in range(SUPADATA_POLL_ATTEMPTS):
                time.sleep(SUPADATA_POLL_INTERVAL_S)
                job = requests.get(f'{base}/transcript/{job_id}', headers=headers, timeout=30)
                data = job.json() if job.ok else {}
                status = data.get('status')
                if status == 'completed':
                    return _supadata_payload_to_tuple(data)
                if status in ('failed', 'error'):
                    logger.info('[scrib-yt] supadata job %s failed for %s', job_id, video_id)
                    return None
                # queued / active — keep polling
            logger.info('[scrib-yt] supadata job %s not done in time for %s', job_id, video_id)
            return None

        if resp.status_code != 200:
            body = {}
            try:
                body = resp.json()
            except Exception:
                pass
            logger.info('[scrib-yt] supadata %s for %s: %s', resp.status_code, video_id,
                        body.get('error') or (resp.text or '')[:150])
            return None
        return _supadata_payload_to_tuple(resp.json())
    except Exception as exc:
        logger.info('[scrib-yt] supadata fetch failed for %s (%s: %s)',
                    video_id, type(exc).__name__, str(exc)[:150])
        return None


def _supadata_payload_to_tuple(data):
    content = (data or {}).get('content')
    if isinstance(content, list):   # text=true was ignored — stitch chunks
        content = ' '.join(c.get('text', '') for c in content if isinstance(c, dict))
    text = (content or '').strip()
    if not text:
        return None
    # Supadata doesn't flag native vs auto-generated in this response; unknown.
    return text, (data.get('lang') or ''), None


def _fetch_transcript_direct(video_id):
    """Scrape YouTube's timedtext endpoint via youtube-transcript-api.

    Blocked from any datacenter IP without a residential proxy — kept as the
    no-key path for local dev and as a backstop.
    """
    try:
        tracks = list(_transcript_client().list(video_id))
        if not tracks:
            return None
        # Human-written beats auto-generated; English beats other languages.
        track = sorted(tracks, key=lambda t: (t.is_generated, t.language_code != 'en'))[0]
        text = ' '.join(s.text for s in track.fetch()).strip()
        if not text:
            return None
        return text, track.language_code, track.is_generated
    except Exception as exc:
        # 120 chars used to cut this off before the actual cause line (RequestBlocked's
        # message is mostly boilerplate preamble) - 400 is enough to see whether it says
        # "IP belonging to a cloud provider" (no proxy applied) vs "despite you using
        # Webshare proxies" (proxy applied, still blocked - a different problem).
        logger.info('[scrib-yt] no transcript for %s (%s: %s)',
                    video_id, type(exc).__name__, str(exc).replace('\n', ' ')[:400])
        return None


_TRANSCRIPT_MISS = '__miss__'   # sentinel so a cached miss is distinguishable from "not cached"


def _fetch_transcript_uncached(video_id):
    """Route to whichever transcript source is configured. Never raises.

    Supadata (managed API) wins when its key is set — no proxy, no bandwidth
    cap, someone else owns YouTube-breakage. Otherwise the direct scrape, which
    needs WEBSHARE_* residential-proxy creds to survive a datacenter IP. Either
    way, None here just means "use the video path".
    """
    if getattr(settings, 'SUPADATA_API_KEY', ''):
        return _fetch_transcript_supadata(video_id)
    return _fetch_transcript_direct(video_id)


def fetch_transcript(video_id):
    """Return ``(text, language, is_generated)`` or ``None``. Never raises.

    Redis-cached by video id (positives for a week, misses for 15 min), and the
    live fetch is run under a hard wall-clock timeout so a proxy retry storm
    can never pin a Celery worker. Any failure -> None -> the video path.
    """
    from django.core.cache import cache
    key = f'scrib_yt_transcript_{video_id}'

    try:
        cached = cache.get(key)
    except Exception:
        cached = None
    if cached == _TRANSCRIPT_MISS:
        # Silent otherwise - this looked exactly like "transcript step never ran" in
        # production logs after a config fix, because nothing logged the skip.
        logger.info('[scrib-yt] transcript cache: negative for %s (cached failure from '
                    'the last %d min - skipping fetch, going straight to video path)',
                    video_id, TRANSCRIPT_NEG_CACHE_TTL_S // 60)
        return None
    if cached:
        text, lang, gen = cached
        logger.info('[scrib-yt] transcript cache hit for %s (%d chars)', video_id, len(text))
        return tuple(cached)

    import concurrent.futures as _f
    result = None
    try:
        with _f.ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(_fetch_transcript_uncached, video_id)
            result = future.result(timeout=TRANSCRIPT_HARD_TIMEOUT_S)
    except _f.TimeoutError:
        logger.warning('[scrib-yt] transcript fetch for %s exceeded %ds - abandoning to video path',
                       video_id, TRANSCRIPT_HARD_TIMEOUT_S)
        result = None
    except Exception as exc:
        logger.info('[scrib-yt] transcript fetch for %s errored (%s)', video_id, exc)
        result = None

    try:
        if result:
            cache.set(key, list(result), TRANSCRIPT_CACHE_TTL_S)
        else:
            cache.set(key, _TRANSCRIPT_MISS, TRANSCRIPT_NEG_CACHE_TTL_S)
    except Exception:
        pass
    return result


def transcript_looks_complete(text, duration_seconds):
    """Cheap sanity check: does this transcript plausibly cover the whole video?

    Speech runs ~130-160 words/minute, so a transcript far below that is
    truncated, partial, or captions for a different cut of the video. It cannot
    judge *correctness* — auto-captions of Telugu transcribed as Hindi score
    fine here — so the model is asked to flag incoherence separately.
    """
    if not text or duration_seconds <= 0:
        return bool(text)
    wpm = len(text.split()) / (duration_seconds / 60)
    if wpm < MIN_TRANSCRIPT_WPM:
        logger.info('[scrib-yt] transcript too thin: %.0f words/min over %s', wpm, _hms(duration_seconds))
        return False
    return True


def _build_transcript_prompt(text, target_topics, video_title, duration_seconds):
    return (
        "Below is the full transcript of a "
        f"{max(round(duration_seconds / 60), 1)}-minute educational video"
        + (f' titled "{video_title}"' if video_title else '')
        + ". Turn it into topics for handwritten revision notes.\n\n"
        "FIRST, judge the transcript itself. Auto-generated captions are sometimes unusable —\n"
        "the wrong language, or so garbled that the subject cannot be recovered. If you cannot\n"
        'reliably tell what is being taught, return {"usable": false, "topics": []} and stop.\n'
        "Ordinary misspellings of technical terms are NOT a reason to bail — correct them\n"
        "silently (e.g. \"WSI\"->OSI, \"Tnet\"->TELNET, \"psycho\"->cycle).\n\n"
        f"Otherwise return {{\"usable\": true, \"topics\": [...]}} with about {target_topics} topics.\n\n"
        "RULES:\n"
        "1. Cover the WHOLE transcript, beginning to end. Do not stop early or thin out at the end.\n"
        "2. Split distinct ideas into SEPARATE topics. Never merge several concepts into one:\n"
        "   \"lists, tuples and sets\" must be three topics; \"DNS, POP3, IMAP and SMTP\" must be four.\n"
        '3. "name": the specific concept, 4-9 words, standalone. Name the real subject —\n'
        "   \"TCP vs UDP: connection-oriented vs datagram\", NOT \"Protocols overview\".\n"
        "   Never generic: no \"Introduction\", \"Overview\", \"Summary\", \"Conclusion\".\n"
        '4. "instruction": 2-4 sentences telling the note-writer exactly what to put on the page —\n'
        "   the definition, the steps, the formula, the worked example WITH ITS ACTUAL NUMBERS,\n"
        "   the comparison points, the gotcha. Concrete enough to write the note from this alone.\n"
        "5. Worked examples, solved problems and exam questions are high value — give them their\n"
        "   own topics and keep their real numbers and answers.\n"
        "6. Every topic must pass this test: would a student write it in a revision notebook\n"
        "   and be tested on it? If not, do NOT create a topic. In particular skip TOOLING\n"
        "   AND ENVIRONMENT SETUP - taught, but never revised:\n"
        "     - downloading/installing interpreters, compilers, IDEs, editors, apps;\n"
        "       choosing a version; PATH or environment-variable configuration\n"
        "     - installing or configuring extensions, plugins, themes, icon packs\n"
        "     - editor/IDE productivity features and keyboard shortcuts (multi-cursor,\n"
        "       autocomplete, refactor shortcuts, split panes)\n"
        "     - creating a project/file/folder in an IDE, where to click to run code\n"
        "     - account signup, dashboards, hosting, version-control tool setup\n"
        "       (unless version control IS the subject)\n"
        "   Also skip: channel intros, \"in this video\", like/subscribe appeals, sponsor\n"
        "   reads, plugs for the creator's notes/course/website, \"links in the description\",\n"
        "   giveaways, and outros.\n"
        "   Borderline: a package install that IS the lesson (e.g. `pip install qrcode`\n"
        "   right before showing that library's API) is fine - the API is the point.\n"
        "   KEEP language/ecosystem concepts that involve a command: virtual environments\n"
        "   and dependency isolation (venv, pip), package managers, and build/run commands\n"
        "   that are part of the language. Those are examinable subject matter.\n"
        "7. Use only what is in the transcript. Do not invent.\n\n"
        f"Transcript:\n{text}\n\n"
        'Return ONLY valid JSON: {"usable": true, "topics":[{"name":"...","instruction":"..."}]}\n'
    )


def organize_from_transcript(text, meta_title='', duration_seconds=0):
    """Turn a transcript into topics in a single text-only call. The cheap path.

    ~10k tokens for an hour of video against ~500k for the video itself, and the
    whole thing fits in one context — so there is no coverage problem to repair
    and no need for the two-pass split.

    Raises ``VideoUnreadable`` when the transcript turns out to be unusable, so
    the caller can fall back to the video path.
    """
    target = target_topic_count(duration_seconds or len(text.split()) / 2.5)
    prompt = _build_transcript_prompt(text, target, meta_title, duration_seconds)
    raw = call_scrib_vertex_ai(
        prompt, response_mime_type='application/json',
        response_schema=TRANSCRIPT_SCHEMA, temperature=EXPAND_TEMPERATURE,
        model=EXPAND_MODEL, request_timeout_s=240,
    )
    parsed = _loads_json(raw, 'transcript topics', salvage_key='topics')

    if isinstance(parsed, dict) and parsed.get('usable') is False:
        raise VideoUnreadable('The captions for this video are not usable.')

    topics = _dedupe(_parse_topics(parsed))
    if len(topics) < MIN_TOPICS:
        raise VideoUnreadable('The captions for this video produced too little to work with.')

    pages = paginate(topics)
    included, overflow = pages[:MAX_PAGES], pages[MAX_PAGES:]
    return {
        'groups': included,
        'total_pages': len(included),
        'remaining_topics': [t['name'] for p in overflow for t in p['topics']],
        'video_title': (meta_title or '')[:200],
        'credits_required': len(included),
        'segments_found': 0,
        'segments_used': 0,
        'source': 'transcript',
    }


# ── Router ──────────────────────────────────────────────────────────────────

def organize(url, meta_title='', duration_seconds=0, progress=None):
    """Turn a video into note pages, cheapest viable route first.

    Transcript first (~10k tokens, one call, seconds), falling back to watching
    the video (~500k tokens, several calls, minutes) whenever the transcript is
    missing, blocked, truncated or incoherent. The fallback means a blocked
    datacenter IP costs us speed and money, never the feature itself.
    """
    report = _safe_progress(progress)
    video_id = url.rsplit('=', 1)[-1]

    report('transcript', 'Reading the video transcript…')
    fetched = fetch_transcript(video_id)
    if fetched:
        text, language, is_generated = fetched
        if transcript_looks_complete(text, duration_seconds):
            logger.info('[scrib-yt] transcript path: %s, %d chars, lang=%s, auto=%s',
                        video_id, len(text), language, is_generated)
            try:
                result = organize_from_transcript(text, meta_title, duration_seconds)
                logger.info('[scrib-yt] transcript path produced %d pages', result['total_pages'])
                return result
            except VideoUnreadable as exc:
                logger.info('[scrib-yt] transcript unusable (%s) - falling back to video', exc.message)
            except Exception as exc:
                logger.warning('[scrib-yt] transcript path failed (%s) - falling back to video', exc)

    report('watching', 'Watching the video…')
    return organize_from_video(url, meta_title, duration_seconds, progress=progress)


def organize_from_video(url, meta_title='', duration_seconds=0, progress=None):
    """Watch the video with Gemini and organise it. The expensive path.

    ~500k input tokens for an hour of video, 2-3 minutes, and it needs the
    outline/repair machinery above because that many tokens don't fit in one
    attention span. Used when no usable transcript is available.
    """
    report = _safe_progress(progress)
    deadline = time.monotonic() + TOTAL_BUDGET_S

    report('watching', 'Watching the video…')
    chapters = extract_outline(url, duration_seconds, progress=progress, deadline=deadline)

    # A segment's length is the gap to the next one (the last runs to the end).
    for i, c in enumerate(chapters):
        end = chapters[i + 1]['start_seconds'] if i + 1 < len(chapters) else duration_seconds
        c['length_seconds'] = max((end or c['start_seconds']) - c['start_seconds'], 0)

    teachable = [c for c in chapters if c['teachable']]
    if len(teachable) < len(chapters):
        logger.info('[scrib-yt] skipped %d non-teachable segment(s): %s',
                    len(chapters) - len(teachable),
                    [c['title'] for c in chapters if not c['teachable']])
    if not teachable:
        # Everything was flagged promo/housekeeping — better to use it all than
        # to tell the user their video produced nothing.
        teachable = chapters

    # Teachable duration drives how many topics the video actually deserves.
    teachable_seconds = sum(c['length_seconds'] for c in teachable)
    if not teachable_seconds:
        teachable_seconds = duration_seconds or len(teachable) * 180

    target = target_topic_count(teachable_seconds)
    logger.info('[scrib-yt] %d segments (%d teachable, ~%s of content) -> target %d topics',
                len(chapters), len(teachable), _hms(teachable_seconds), target)

    report('expanding', f'Found {len(teachable)} sections — writing topics…')
    topics = _dedupe(expand_topics(teachable, target, meta_title))
    if not topics:
        raise VideoUnreadable("This video didn't produce any notes. Try a different video.")

    pages = paginate(topics)
    included, overflow = pages[:MAX_PAGES], pages[MAX_PAGES:]
    remaining_topics = [t['name'] for p in overflow for t in p['topics']]

    total_pages = len(included)
    return {
        'groups': included,
        'total_pages': total_pages,
        'remaining_topics': remaining_topics,
        'video_title': (meta_title or '')[:200],
        'credits_required': total_pages,
        'segments_found': len(chapters),
        'segments_used': len(teachable),
        'source': 'video',
    }
