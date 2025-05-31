from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_learning_plan import LearningPlanViewSet, generate_learning_plan

router = DefaultRouter()
router.register(r'learning-plans', LearningPlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('generate-learning-plan/', generate_learning_plan, name='generate-learning-plan'),
]
