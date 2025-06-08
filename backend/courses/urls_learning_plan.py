from django.urls import path, include
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_learning_plan import AILearningPlanViewSet, generate_learning_plan, get_user_learning_plans, update_learning_plan_progress, submit_ai_quiz

router = DefaultRouter()
router.register(r'plans', AILearningPlanViewSet, basename='ailearningplan')

urlpatterns = [
    path('', include(router.urls)),
    path('generate-learning-plan/', generate_learning_plan, name='generate-learning-plan'),
    path('user-plans/', get_user_learning_plans, name='user-learning-plans'),
    path('update-progress/<uuid:plan_id>/', update_learning_plan_progress, name='update-learning-plan-progress'),
    path('submit-quiz/<uuid:plan_id>/<str:lesson_id>/', submit_ai_quiz, name='submit-ai-quiz'),
]
