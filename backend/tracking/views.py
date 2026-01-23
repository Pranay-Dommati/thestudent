from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from .models import UserActivity
from django.db.models import Count, Min, Max, Sum, Case, When, IntegerField


import posthog
from django.conf import settings
from uuid import uuid4

# Initialize PostHog once at module load
if settings.POSTHOG_API_KEY:
    posthog.project_api_key = settings.POSTHOG_API_KEY
    posthog.host = settings.POSTHOG_HOST

@api_view(["POST"])  # accepts a single event
@permission_classes([AllowAny])
def track_activity(request):
    """Track one analytics event.

    Expected JSON body:
    {
      "session_id": "uuid",
      "event_type": "pro_learning.save_attempted",
      "feature": "pro_learning",
      "metadata": { ... },
      "latency_ms": 123,
      "success": true,
      "error_code": null,
      "client_ts": "2025-09-20T12:34:56.000Z"
    }
    """
    data = request.data or {}
    
    # 1. Extract IDs from Headers (Critical for Session Consistency)
    header_session_id = request.headers.get("X-PostHog-Session-Id")
    header_distinct_id = request.headers.get("X-PostHog-Distinct-Id")
    
    # Fallback to body if headers missing (e.g. manual calls)
    session_id = header_session_id or data.get("session_id")
    # If no distinct_id in header, check user or fallback to session_id
    distinct_id = header_distinct_id
    if not distinct_id:
        if request.user and request.user.is_authenticated:
            distinct_id = str(request.user.id)
        else:
            distinct_id = session_id 

    # Fallback strategy: if absolutely no session_id, generate one to prevent data loss
    if not session_id:
        session_id = f"server-{uuid4()}"
        if not distinct_id:
            distinct_id = session_id

    event_type = data.get("event_type")
    metadata = data.get("metadata") or {}

    if not event_type:
        return Response({"error": "event_type is required"}, status=status.HTTP_400_BAD_REQUEST)

    feature = data.get("feature")
    latency_ms = data.get("latency_ms")
    success = data.get("success", True)
    error_code = data.get("error_code")
    client_ts = data.get("client_ts")

    client_dt = None
    if client_ts:
        try:
            client_dt = parse_datetime(client_ts)
        except Exception:
            client_dt = None

    # Track in DB
    UserActivity.objects.create(
        session_id=session_id,
        user=request.user if request.user and request.user.is_authenticated else None,
        event_type=event_type,
        feature=feature,
        metadata=metadata,
        latency_ms=latency_ms,
        success=bool(success),
        error_code=error_code,
        client_ts=client_dt,
    )

    # Track in PostHog (Server-side capture)
    if settings.POSTHOG_API_KEY:
        try:
            properties = {
                '$session_id': session_id,
                'feature': feature,
                'success': success,
                'latency_ms': latency_ms,
                'error_code': error_code,
                **metadata,
            }
            posthog.capture(
                distinct_id=distinct_id,
                event=event_type,
                properties=properties
            )
        except Exception as e:
            # Don't fail the request if PostHog tracking fails
            pass

    return Response({"status": "ok"}, status=status.HTTP_200_OK)


@api_view(["POST"])  # accepts a batch of events
@permission_classes([AllowAny])
def track_activity_bulk(request):
    """Track multiple analytics events in a single request."""
    payload = request.data or {}
    events = payload.get("events") or []
    if not isinstance(events, list) or not events:
        return Response({"error": "events must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

    # Headers apply to the whole batch if they exist
    header_session_id = request.headers.get("X-PostHog-Session-Id")
    header_distinct_id = request.headers.get("X-PostHog-Distinct-Id")

    created = 0
    for data in events:
        try:
            # Per-event extraction with header fallback
            # We strictly respect the event's own session_id if present, else fallback to header
            event_session_id = data.get("session_id") or header_session_id
            
            # For distinct_id, usually the batch comes from one user/session. 
            # If header distinct_id is present, use it. Else check user.
            event_distinct_id = header_distinct_id
            if not event_distinct_id:
                if request.user and request.user.is_authenticated:
                    event_distinct_id = str(request.user.id)
                else:
                    event_distinct_id = event_session_id

            if not event_session_id:
                 event_session_id = f"server-{uuid4()}"
                 if not event_distinct_id:
                     event_distinct_id = event_session_id

            event_type = data.get("event_type")
            if not event_type:
                continue
                
            metadata = data.get("metadata") or {}
            feature = data.get("feature")
            latency_ms = data.get("latency_ms")
            success = data.get("success", True)
            error_code = data.get("error_code")
            client_ts = data.get("client_ts")

            client_dt = None
            if client_ts:
                try:
                    client_dt = parse_datetime(client_ts)
                except Exception:
                    client_dt = None

            # DB Create
            UserActivity.objects.create(
                session_id=event_session_id,
                user=request.user if request.user and request.user.is_authenticated else None,
                event_type=event_type,
                feature=feature,
                metadata=metadata,
                latency_ms=latency_ms,
                success=bool(success),
                error_code=error_code,
                client_ts=client_dt,
            )
            created += 1

            # PostHog Capture
            if settings.POSTHOG_API_KEY:
                properties = {
                    '$session_id': event_session_id,
                    'feature': feature,
                    'success': success,
                    'latency_ms': latency_ms,
                    'error_code': error_code,
                    **metadata,
                }
                posthog.capture(
                    distinct_id=event_distinct_id,
                    event=event_type,
                    properties=properties
                )

        except Exception:
            # best-effort; skip bad events
            continue

    return Response({"status": "ok", "created": created}, status=status.HTTP_200_OK)


@api_view(["GET"])  # recent events feed for admin with simple filters
@permission_classes([IsAuthenticatedOrReadOnly])
def recent_events(request):
    qs = UserActivity.objects.all()

    # Filters: last=24h|7d|30d or since=ISO8601
    last = request.query_params.get("last")
    since = request.query_params.get("since")
    feature = request.query_params.get("feature")
    event_type = request.query_params.get("event_type")
    contains = request.query_params.get("contains")
    success = request.query_params.get("success")  # "true" | "false"
    limit = min(int(request.query_params.get("limit", 200)), 2000)

    if last:
        now = timezone.now()
        last = last.lower()
        if last.endswith("h") and last[:-1].isdigit():
            hours = int(last[:-1])
            qs = qs.filter(created_at__gte=now - timezone.timedelta(hours=hours))
        elif last.endswith("d") and last[:-1].isdigit():
            days = int(last[:-1])
            qs = qs.filter(created_at__gte=now - timezone.timedelta(days=days))
    elif since:
        try:
            dt = parse_datetime(since)
            if dt is not None:
                qs = qs.filter(created_at__gte=dt)
        except Exception:
            pass

    if feature:
        qs = qs.filter(feature=feature)
    if event_type:
        qs = qs.filter(event_type=event_type)
    if contains:
        qs = qs.filter(event_type__icontains=contains)
    if success in ("true", "false"):
        qs = qs.filter(success=(success == "true"))

    qs = qs.order_by("-created_at")[:limit]

    data = [
        {
            "id": e.id,
            "session_id": e.session_id,
            "user_id": e.user_id,
            "event_type": e.event_type,
            "feature": e.feature,
            "success": e.success,
            "error_code": e.error_code,
            "latency_ms": e.latency_ms,
            "created_at": e.created_at.isoformat(),
            "metadata": e.metadata,
        }
        for e in qs
    ]
    return Response({"events": data, "count": len(data)})


@api_view(["GET"])  # aggregated sessions for replay view
@permission_classes([IsAuthenticatedOrReadOnly])
def recent_sessions(request):
    """Return recent sessions with basic aggregates for Admin Replay.

    Query params similar to recent_events:
    - last=24h|7d|30d or since=ISO8601
    - feature=foo (optional)
    - success=true|false (optional)
    - contains=substring (filters event_type contains, case-insensitive)
    - limit= max events considered (default 1000)

    Response shape:
    {
      "sessions": [
        {
          "session_id": "...",
          "count": 12,
          "success": 10,
          "fail": 2,
          "first": "ISO",
          "last": "ISO",
          "duration_min": 3
        }, ...
      ]
    }
    """
    qs = UserActivity.objects.all()

    last = request.query_params.get("last")
    since = request.query_params.get("since")
    feature = request.query_params.get("feature")
    success = request.query_params.get("success")  # "true" | "false"
    contains = request.query_params.get("contains")
    limit = min(int(request.query_params.get("limit", 1000)), 5000)

    if last:
        now = timezone.now()
        last = last.lower()
        if last.endswith("h") and last[:-1].isdigit():
            hours = int(last[:-1])
            qs = qs.filter(created_at__gte=now - timezone.timedelta(hours=hours))
        elif last.endswith("d") and last[:-1].isdigit():
            days = int(last[:-1])
            qs = qs.filter(created_at__gte=now - timezone.timedelta(days=days))
    elif since:
        try:
            dt = parse_datetime(since)
            if dt is not None:
                qs = qs.filter(created_at__gte=dt)
        except Exception:
            pass

    if feature:
        qs = qs.filter(feature=feature)
    if success in ("true", "false"):
        qs = qs.filter(success=(success == "true"))
    if contains:
        qs = qs.filter(event_type__icontains=contains)

    # Limit the number of events considered for aggregation for performance
    qs = qs.order_by("-created_at")[:limit]

    # Aggregate in Python (size is capped); for large datasets consider DB-level grouping
    by_session = {}
    for e in qs:
        sid = e.session_id or "unknown"
        if sid not in by_session:
            by_session[sid] = {
                "session_id": sid,
                "count": 0,
                "success": 0,
                "fail": 0,
                "first": None,
                "last": None,
            }
        s = by_session[sid]
        s["count"] += 1
        if e.success:
            s["success"] += 1
        else:
            s["fail"] += 1
        if s["first"] is None or e.created_at < s["first"]:
            s["first"] = e.created_at
        if s["last"] is None or e.created_at > s["last"]:
            s["last"] = e.created_at

    sessions = []
    for s in by_session.values():
        first = s["first"]
        last_dt = s["last"]
        duration_min = 0
        if first and last_dt:
            duration_min = max(0, int((last_dt - first).total_seconds() // 60))
        sessions.append({
            "session_id": s["session_id"],
            "count": s["count"],
            "success": s["success"],
            "fail": s["fail"],
            "first": first.isoformat() if first else None,
            "last": last_dt.isoformat() if last_dt else None,
            "duration_min": duration_min,
        })

    # Sort by last descending
    sessions.sort(key=lambda x: x["last"] or "", reverse=True)

    return Response({"sessions": sessions, "count": len(sessions)})


@api_view(["GET"])  # aggregated sessions for replay view
@permission_classes([IsAuthenticatedOrReadOnly])
def recent_sessions(request):
    """Return aggregated session summaries for the given time window and filters.

    Query params: same as recent_events (last|since|feature|event_type|contains|success|limit)
    Response: { sessions: [ { id, count, success, fail, first, last, duration_sec } ], count }
    """
    qs = UserActivity.objects.all()

    last = request.query_params.get("last")
    since = request.query_params.get("since")
    feature = request.query_params.get("feature")
    event_type = request.query_params.get("event_type")
    contains = request.query_params.get("contains")
    success = request.query_params.get("success")  # "true" | "false"
    limit = min(int(request.query_params.get("limit", 500)), 5000)

    if last:
        now = timezone.now()
        last = last.lower()
        if last.endswith("h") and last[:-1].isdigit():
            hours = int(last[:-1])
            qs = qs.filter(created_at__gte=now - timezone.timedelta(hours=hours))
        elif last.endswith("d") and last[:-1].isdigit():
            days = int(last[:-1])
            qs = qs.filter(created_at__gte=now - timezone.timedelta(days=days))
    elif since:
        try:
            dt = parse_datetime(since)
            if dt is not None:
                qs = qs.filter(created_at__gte=dt)
        except Exception:
            pass

    if feature:
        qs = qs.filter(feature=feature)
    if event_type:
        qs = qs.filter(event_type=event_type)
    if contains:
        qs = qs.filter(event_type__icontains=contains)
    if success in ("true", "false"):
        qs = qs.filter(success=(success == "true"))

    # Aggregate by session_id
    agg = (
        qs.values("session_id")
        .annotate(
            count=Count("id"),
            first=Min("created_at"),
            last=Max("created_at"),
            success_count=Sum(Case(When(success=True, then=1), default=0, output_field=IntegerField())),
        )
        .order_by("-last")[:limit]
    )

    sessions = []
    for row in agg:
        c = int(row["count"] or 0)
        succ = int(row["success_count"] or 0)
        fail = max(0, c - succ)
        first = row["first"]
        last_dt = row["last"]
        duration_sec = int(max(0, (last_dt - first).total_seconds())) if first and last_dt else 0
        # Try to extract a representative host/origin from the most recent event in this session
        host = None
        try:
            latest = (
                UserActivity.objects.filter(session_id=row["session_id"])
                .order_by("-created_at")
                .only("metadata")
                .first()
            )
            if latest and isinstance(latest.metadata, dict):
                host = latest.metadata.get("site_host") or latest.metadata.get("host")
        except Exception:
            host = None
        sessions.append(
            {
                "id": row["session_id"] or "unknown",
                "count": c,
                "success": succ,
                "fail": fail,
                "first": first.isoformat() if first else None,
                "last": last_dt.isoformat() if last_dt else None,
                "duration_sec": duration_sec,
                "host": host,
            }
        )

    return Response({"sessions": sessions, "count": len(sessions)})
