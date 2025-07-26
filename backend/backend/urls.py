from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # ... other URL patterns
    path('', include('courses.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/chatbot/', include('chatbotcourse.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path('ai/', include('backend.ai.urls')),
]
