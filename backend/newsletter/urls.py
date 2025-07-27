from django.urls import path
from . import views

app_name = 'newsletter'

urlpatterns = [
    # API endpoint for newsletter subscription and listing
    path('', views.NewsletterAPIView.as_view(), name='newsletter_api'),
    
    # API endpoint for individual newsletter operations (DELETE, PATCH)
    path('<int:newsletter_id>/', views.NewsletterDetailAPIView.as_view(), name='newsletter_detail'),
]
