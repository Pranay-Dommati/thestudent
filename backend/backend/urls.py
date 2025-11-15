from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache


@require_http_methods(["GET", "HEAD"])  # Only allow safe methods
@never_cache  # Avoid caching to reflect real-time health
def ping_view(request):
    """Lightweight health check endpoint.

    Returns a minimal JSON payload without touching the database or printing logs.
    """
    return JsonResponse({"status": "ok"})

urlpatterns = [
    # Health check endpoint
    path('ping/', ping_view),

    path('admin/', admin.site.urls),  # Custom admin path as requested
    # ... other URL patterns
    path('', include('courses.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/chatbot/', include('chatbotcourse.urls')),
    path('api/feedback/', include('feedback.urls')),  # Add feedback app
    path('api/newsletter/', include('newsletter.urls')),  # Add newsletter app
    path('api/analytics/', include('tracking.urls')),  # Analytics/tracking endpoints
] + (static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) if settings.DEBUG else [])

urlpatterns += [
    path('ai/', include('backend.ai.urls')),
]

# In production, serve media via Django as a simple fallback (consider CDN/object storage for scale)
if not settings.DEBUG and settings.MEDIA_URL and settings.MEDIA_ROOT:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
    ]
