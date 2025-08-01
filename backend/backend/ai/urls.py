from django.urls import path
from . import views

urlpatterns = [
    path('quiz/', views.quiz, name='ai-quiz'),
    path('summary/', views.summary, name='ai-summary'),
    path('reading/', views.reading, name='ai-reading'),
    path('resources/', views.resources, name='ai-resources'),
    path('videos/', views.videos, name='ai-videos'),
    path('topics/', views.topics, name='ai-topics'),
    path('classify_topics/', views.classify_topics, name='ai-classify-topics'),
    path('classify-topics/', views.classify_topics, name='ai-classify-topics-alt'),
    path('create-course-topics/', views.create_course_topics, name='ai-create-course-topics'),
    path('rate-limit-status/', views.get_topic_rate_limit_status, name='ai-rate-limit-status'),
] 