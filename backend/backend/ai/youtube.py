from django.http import JsonResponse
from django.conf import settings
import json
import logging
import requests
import re

logger = logging.getLogger(__name__)

def handle_youtube_search(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        yt_key = getattr(settings, 'YOUTUBE_API_KEY', None)
        if not yt_key:
            return JsonResponse({'error': 'YouTube API key not configured'}, status=500)

        try:
            body = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        topic = str(body.get('topic', '')).strip()
        max_results = int(body.get('maxResults', 10))
        if not topic:
            return JsonResponse({'error': 'topic is required'}, status=400)

        sanitized = re.sub(r"[^\w\s-]", "", topic).strip()
        query = re.sub(r"\s+", "+", sanitized)

        search_params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'maxResults': max_results,
            'videoEmbeddable': 'true',
            'relevanceLanguage': 'en',
            'safeSearch': 'strict',
            'key': yt_key,
        }

        search_url = 'https://www.googleapis.com/youtube/v3/search'
        details_url = 'https://www.googleapis.com/youtube/v3/videos'

        sr = requests.get(search_url, params=search_params, timeout=20)
        if sr.status_code != 200:
            try:
                err = sr.json()
            except Exception:
                err = {'message': sr.text}
            logger.error(f"YouTube search error {sr.status_code}: {err}")
            return JsonResponse({'error': 'youtube_search_failed', 'details': err}, status=sr.status_code)

        sdata = sr.json()
        items = sdata.get('items', [])
        if not items:
            return JsonResponse({'videos': []})

        video_ids = ",".join([it.get('id', {}).get('videoId') for it in items if it.get('id', {}).get('videoId')])
        if not video_ids:
            return JsonResponse({'videos': []})

        details_params = {
            'part': 'contentDetails,statistics,snippet',
            'id': video_ids,
            'key': yt_key,
        }
        dr = requests.get(details_url, params=details_params, timeout=20)
        if dr.status_code != 200:
            try:
                derr = dr.json()
            except Exception:
                derr = {'message': dr.text}
            logger.error(f"YouTube details error {dr.status_code}: {derr}")
            return JsonResponse({'error': 'youtube_details_failed', 'details': derr}, status=dr.status_code)

        ddata = dr.json()
        details_map = {it.get('id'): it for it in ddata.get('items', [])}

        def calc_quality(d):
            try:
                stats = d.get('statistics', {}) if d else {}
                views = int(stats.get('viewCount', 0))
                likes = int(stats.get('likeCount', 0)) if stats.get('likeCount') else 0
                return int(views * 0.7 + likes * 0.3)
            except Exception:
                return 0

        def best_thumb(sn):
            t = (sn or {}).get('thumbnails', {})
            return (
                (t.get('maxres') or {}).get('url') or
                (t.get('high') or {}).get('url') or
                (t.get('medium') or {}).get('url') or
                (t.get('default') or {}).get('url') or ''
            )

        results = []
        for it in items:
            vid = it.get('id', {}).get('videoId')
            sn = it.get('snippet', {})
            dd = details_map.get(vid, {})
            cd = dd.get('contentDetails', {})
            st = dd.get('statistics', {})
            results.append({
                'id': vid,
                'title': sn.get('title', ''),
                'description': sn.get('description', ''),
                'thumbnail': best_thumb(sn),
                'channelTitle': sn.get('channelTitle', ''),
                'publishedAt': sn.get('publishedAt', ''),
                'duration': cd.get('duration', 'PT0M'),
                'viewCount': int(st.get('viewCount', 0)) if str(st.get('viewCount', '0')).isdigit() else 0,
                'quality': calc_quality(dd),
            })

        def is_educational(title, description):
            txt = f"{title} {description}".lower()
            edu = [
                'tutorial','learn','guide','course','lesson','teach','explain','explained',
                'how to','step by step','complete','full','introduction','basics','fundamentals',
                'beginners','advanced','master','understanding','concept','theory','practical',
                'examples','illustrated','detailed','comprehensive','overview','working','principle'
            ]
            non = ['reaction','review','unboxing','vlog','funny','meme','prank','challenge','compilation']
            return any(w in txt for w in edu) and not any(w in txt for w in non)

        curated = [v for v in results if is_educational(v['title'], v['description'])]
        final = curated if len(curated) >= max(3, len(results)//2) else results

        return JsonResponse({'videos': final})

    except Exception as e:
        logger.error(f"YouTube search exception: {e}")
        return JsonResponse({'error': 'internal_error', 'details': str(e)}, status=500)
