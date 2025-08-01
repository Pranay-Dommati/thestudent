from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    LoginView, 
    user_profile, 
    admin_login, 
    verify_admin_token,
    google_auth_url,
    google_auth_callback,
    google_auth_token
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('admin-login/', admin_login, name='admin_login'),
    path('verify-admin/', verify_admin_token, name='verify_admin_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', user_profile, name='user_profile'),
    
    # Google OAuth2 endpoints
    path('google/auth-url/', google_auth_url, name='google_auth_url'),
    path('google/callback/', google_auth_callback, name='google_auth_callback'),
    path('google/token/', google_auth_token, name='google_auth_token'),
    
    # Social auth URLs (for traditional social-auth-app-django flow)
    path('social/', include('social_django.urls', namespace='social')),
]