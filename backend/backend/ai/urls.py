from django.urls import path
from . import views

urlpatterns = [
    path('quiz/', views.quiz, name='ai-quiz'),
    path('summary/', views.summary, name='ai-summary'),
    path('reading/', views.reading, name='ai-reading'),
    path('resources/', views.resources, name='ai-resources'),
    path('videos/', views.videos, name='ai-videos'),
    path('topics/', views.topics, name='ai-topics'),
] 