from django.urls import path
from . import views

app_name = 'feedback'

urlpatterns = [
    # API endpoint for feedback submission and listing
    path('', views.FeedbackAPIView.as_view(), name='feedback_api'),
    
    # API endpoint for individual feedback operations (DELETE)
    path('<int:feedback_id>/', views.FeedbackDetailAPIView.as_view(), name='feedback_detail'),
    
    # Alternative function-based view endpoint
    path('submit/', views.submit_feedback, name='submit_feedback'),
]
