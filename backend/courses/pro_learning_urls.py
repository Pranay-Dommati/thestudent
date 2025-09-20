from django.urls import path
from django.conf import settings
from .pro_learning_views import (
    ProLearningCourseListCreateView,
    ProLearningCourseDetailView,
    ProLearningTopicListView,
    ProLearningTopicDetailView,
    mark_topic_complete,
    get_course_progress,
)
from .working_views import save_pro_learning_course  # Use robust save handler for production
## Dev-only endpoints imported under DEBUG at bottom

app_name = 'pro_learning'

urlpatterns = [
    # Secure endpoints
    # Route save endpoints to the working view that matches current models/fields
    path('save-course/', save_pro_learning_course, name='save-course'),
    path('save-from-storage/', save_pro_learning_course, name='save-from-storage'),
    path('save-from-storage', save_pro_learning_course, name='save-from-storage-no-slash'),

    # Course management
    path('', ProLearningCourseListCreateView.as_view(), name='course-list-create'),
    path('<str:id>/', ProLearningCourseDetailView.as_view(), name='course-detail'),
    path('<str:id>/progress/', get_course_progress, name='course-progress'),
    
    # Topic management
    path('<str:id>/topics/', ProLearningTopicListView.as_view(), name='topic-list'),
    path('<str:id>/topics/<int:topic_id>/', ProLearningTopicDetailView.as_view(), name='topic-detail'),
    path('<str:id>/topics/<int:topic_id>/complete/', mark_topic_complete, name='topic-complete'),
]

# Dev/test-only endpoints
if settings.DEBUG:
    from .simple_test_view import simple_test_view
    from .simple_django_view import save_course_from_localStorage_simple
    from .working_views import save_pro_learning_course, test_endpoint
    urlpatterns += [
        path('save-course-dev/', save_pro_learning_course, name='save-course-dev'),
        path('save-from-storage-simple/', save_course_from_localStorage_simple, name='save-from-storage-simple'),
        path('test/', test_endpoint, name='test'),
        path('test-post/', simple_test_view, name='test-post'),
    ]
