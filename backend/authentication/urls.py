from django.urls import path, include
from .views import (
    RegisterView, 
    LoginView, 
    user_profile, 
    admin_login, 
    verify_admin_token,
    admin_list_users,
    admin_user_detail,
    google_auth_url,
    google_auth_callback,
    google_auth_token,
    otp_signup,
    otp_verify,
    otp_resend,
    smtp_test,
    forgot_password,
    admin_forgot_password,
    reset_password,
    validate_reset_token,
    admin_set_user_password,
    TokenRefreshViewWithRetry,  # Custom token refresh with retry logic
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('admin-login/', admin_login, name='admin_login'),
    path('verify-admin/', verify_admin_token, name='verify_admin_token'),
    path('users/', admin_list_users, name='admin_list_users'),
    path('users/<int:user_id>/', admin_user_detail, name='admin_user_detail'),
    path('users/<int:user_id>/set-password/', admin_set_user_password, name='admin_set_user_password'),
    path('token/refresh/', TokenRefreshViewWithRetry.as_view(), name='token_refresh'),  # Use retry-enabled view
    path('profile/', user_profile, name='user_profile'),
    
    # Google OAuth2 endpoints
    path('google/auth-url/', google_auth_url, name='google_auth_url'),
    path('google/callback/', google_auth_callback, name='google_auth_callback'),
    path('google/token/', google_auth_token, name='google_auth_token'),

    # Email OTP signup endpoints
    path('otp/signup/', otp_signup, name='otp_signup'),
    path('otp/verify/', otp_verify, name='otp_verify'),
    path('otp/resend/', otp_resend, name='otp_resend'),
    path('otp/smtp-test/', smtp_test, name='smtp_test'),
    
    # Password reset endpoints
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('admin-forgot-password/', admin_forgot_password, name='admin_forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    path('validate-reset-token/<str:uid>/<str:token>/', validate_reset_token, name='validate_reset_token'),
    
    # Social auth URLs (for traditional social-auth-app-django flow)
    path('social/', include('social_django.urls', namespace='social')),
]