from django.urls import path
from . import views

urlpatterns = [
    path('quiz/', views.quiz, name='ai-quiz'),
    path('summary/', views.summary, name='ai-summary'),
    path('reading/', views.reading, name='ai-reading'),
    path('resources/', views.resources, name='ai-resources'),
    path('videos/', views.videos, name='ai-videos'),
    path('youtube_search/', views.youtube_search, name='ai-youtube-search'),
    path('topics/', views.topics, name='ai-topics'),
    path('classify_topics/', views.classify_topics, name='ai-classify-topics'),
    path('classify-topics/', views.classify_topics, name='ai-classify-topics-alt'),
    path('create-course-topics/', views.create_course_topics, name='ai-create-course-topics'),
    path('rate-limit-status/', views.get_topic_rate_limit_status, name='ai-rate-limit-status'),
    path('get-topic-rate-limit-status/', views.get_topic_rate_limit_status, name='ai-get-topic-rate-limit-status'),
    path('debug-rate-limit-cache/', views.debug_rate_limit_cache, name='ai-debug-rate-limit-cache'),
] 