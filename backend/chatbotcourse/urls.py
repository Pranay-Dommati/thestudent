from django.urls import path
from . import views

urlpatterns = [
    path('chat/general/', views.chat_general, name='chat_general'),
    path('analyze-subject/', views.analyze_subject, name='analyze_subject'),
    path('health/', views.health_check, name='health_check'),
]
