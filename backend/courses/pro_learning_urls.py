from django.urls import path
from .pro_learning_views import (
    ProLearningCourseListCreateView,
    ProLearningCourseDetailView,
    ProLearningTopicListView,
    ProLearningTopicDetailView,
    mark_topic_complete,
    get_course_progress,
    save_course_from_localStorage
)
from .simple_test_view import simple_test_view
from .simple_django_view import save_course_from_localStorage_simple
from .working_views import save_pro_learning_course, test_endpoint

app_name = 'pro_learning'

urlpatterns = [
    # Course management
    path('', ProLearningCourseListCreateView.as_view(), name='course-list-create'),
    path('<str:course_id>/', ProLearningCourseDetailView.as_view(), name='course-detail'),
    path('<str:course_id>/progress/', get_course_progress, name='course-progress'),
    
    # Topic management
    path('<str:course_id>/topics/', ProLearningTopicListView.as_view(), name='topic-list'),
    path('<str:course_id>/topics/<int:topic_id>/', ProLearningTopicDetailView.as_view(), name='topic-detail'),
    path('<str:course_id>/topics/<int:topic_id>/complete/', mark_topic_complete, name='topic-complete'),
    
    # Special endpoint for saving from localStorage
    path('save-from-storage/', save_course_from_localStorage, name='save-from-storage'),
    path('save-from-storage', save_course_from_localStorage, name='save-from-storage-no-slash'),
    
    # Alternative simple implementation for testing
    path('save-from-storage-simple/', save_course_from_localStorage_simple, name='save-from-storage-simple'),
    
    # WORKING ENDPOINTS - Use these!
    path('save-course/', save_pro_learning_course, name='save-course'),
    path('test/', test_endpoint, name='test'),
    
    # Simple test endpoint
    path('test-post/', simple_test_view, name='test-post'),
]
