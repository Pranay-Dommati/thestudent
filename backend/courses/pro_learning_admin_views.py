from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from .models import ProLearningTopic


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_pro_learning_topics(request):
    """
    Admin: List ProLearning topics across all users with user details and timestamps.

    Query params:
    - last=24h|7d|30d (optional) or since=ISO8601
    - limit: max number of topics to return (default 500, max 2000)

    Response shape:
    { "items": [
        {
          "topic_id": str,
          "topic_name": str,
          "course_id": str,
          "course_title": str,
          "user_id": int,
          "user_name": str,
          "user_email": str,
          "is_completed": bool,
          "progress_percentage": number,
          "created_at": ISO,
          "updated_at": ISO,
          "completed_at": ISO|null
        }, ...
      ], "count": n }
    """
    qs = ProLearningTopic.objects.select_related("course", "course__user").all()

    last = (request.query_params.get("last") or "").lower()
    since = request.query_params.get("since")
    limit = min(int(request.query_params.get("limit", 500)), 2000)

    if last:
        now = timezone.now()
        if last.endswith("h") and last[:-1].isdigit():
            hours = int(last[:-1])
            qs = qs.filter(updated_at__gte=now - timezone.timedelta(hours=hours))
        elif last.endswith("d") and last[:-1].isdigit():
            days = int(last[:-1])
            qs = qs.filter(updated_at__gte=now - timezone.timedelta(days=days))
    elif since:
        try:
            dt = parse_datetime(since)
            if dt is not None:
                qs = qs.filter(updated_at__gte=dt)
        except Exception:
            pass

    qs = qs.order_by("-updated_at")[:limit]

    items = []
    for t in qs:
        u = t.course.user if t.course else None
        items.append({
            "topic_id": str(t.id),
            "topic_name": t.topic_name,
            "course_id": str(t.course.id) if t.course else None,
            "course_title": getattr(t.course, "course_name", None) or getattr(t.course, "title", None),
            "user_id": u.id if u else None,
            "user_name": getattr(u, "get_full_name", lambda: None)() or getattr(u, "username", None) or getattr(u, "email", None),
            "user_email": getattr(u, "email", None),
            "is_completed": bool(t.is_completed),
            "progress_percentage": float(t.progress_percentage or 0),
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        })

    return Response({"items": items, "count": len(items)}, status=status.HTTP_200_OK)
