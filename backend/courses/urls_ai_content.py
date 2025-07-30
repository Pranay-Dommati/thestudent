from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_ai_content import AIContentViewSet, get_user_ai_content, create_ai_content, get_ai_content_by_course, get_ai_learning_plan

router = DefaultRouter()
router.register(r'plans', AIContentViewSet, basename='ai-content')

urlpatterns = [
    path('', include(router.urls)),
    path('user-plans/', get_user_ai_content, name='user-ai-content'),
    path('course/<str:course_title>/', get_ai_content_by_course, name='ai-content-by-course'),
    path('plan/<int:plan_id>/', get_ai_learning_plan, name='get_ai_learning_plan'),
]
