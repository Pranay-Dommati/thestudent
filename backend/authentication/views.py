from django.shortcuts import render, redirect
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login, get_user_model
from django.conf import settings
from django.http import JsonResponse
from urllib.parse import urlencode
import logging
import requests
from django.core.mail import send_mail
from django.db.models import Q
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template.loader import render_to_string
from django.urls import reverse
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import socket

from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    OTPSignupSerializer, OTPVerifySerializer, OTPResendSerializer,
)
from .models import User, EmailOTP

# Import database retry utilities for handling remote MySQL (Hostinger) connection issues
from backend.db_utils import db_retry_on_connection_error

logger = logging.getLogger(__name__)


def send_email_via_smtp(to_email: str, subject: str, html_content: str) -> bool:
    """Send an HTML email using SMTP settings from Django settings.
    Supports SSL (port 465) or STARTTLS based on settings.
    Returns True on success, False on failure.
    """
    try:
        smtp_host = getattr(settings, 'SMTP_HOST', '')
        smtp_port = int(getattr(settings, 'SMTP_PORT', 465))
        smtp_username = getattr(settings, 'SMTP_USERNAME', '')
        smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        use_ssl = getattr(settings, 'SMTP_USE_SSL', True)
        use_tls = getattr(settings, 'SMTP_USE_TLS', False)

        if not (smtp_host and smtp_port and smtp_username and smtp_password):
            if getattr(settings, 'DEBUG', False):
                logger.error("SMTP settings are not fully configured. Skipping email send.")
            return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg.attach(MIMEText(html_content, 'html'))

        if use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
        if getattr(settings, 'DEBUG', False):
            logger.debug(f"Email sent to {to_email} with subject '{subject}'")
        return True
    except Exception as e:
        if getattr(settings, 'DEBUG', False):
            logger.error(f"Failed to send email to {to_email}: {e}")
        return False

class RegisterView(generics.CreateAPIView):
    # Public endpoint: no auth required and skip JWT auth entirely
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Avoid noisy logs in production
            if getattr(settings, 'DEBUG', False):
                logger.debug({"validation_errors": serializer.errors})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.CreateAPIView):
    # Public endpoint: no auth required and skip JWT auth entirely
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        if getattr(settings, 'DEBUG', False):
            logger.debug("Login attempt received")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            if getattr(settings, 'DEBUG', False):
                logger.debug(f"Login validation error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = authenticate(
                request=request,
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            
            if not user:
                if getattr(settings, 'DEBUG', False):
                    logger.debug("Invalid credentials")
                return Response(
                    {"non_field_errors": ["Invalid email or password"]},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not user.is_active:
                if getattr(settings, 'DEBUG', False):
                    logger.debug("Inactive user account")
                return Response(
                    {"non_field_errors": ["Account is disabled"]},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            refresh = RefreshToken.for_user(user)
            if getattr(settings, 'DEBUG', False):
                logger.debug("Login successful")
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            if getattr(settings, 'DEBUG', False):
                logger.exception(f"Login error: {str(e)}")
            return Response(
                {"non_field_errors": ["An error occurred during login"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def otp_signup(request):
    """Start signup: create inactive user, generate OTP, email it."""
    try:
        serializer = OTPSignupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        full_name = serializer.validated_data['full_name']
        email = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']

        # If user exists but inactive, reuse; else create inactive
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'is_active': False,
                'agreed_to_terms': serializer.validated_data.get('agreed_to_terms', False),
                'auth_method': 'email',
            }
        )
        if created:
            user.set_password(password)
            user.save()
        else:
            # Update name/password if still inactive
            if not user.is_active:
                user.full_name = full_name
                user.set_password(password)
                user.agreed_to_terms = serializer.validated_data.get('agreed_to_terms', False)
                user.auth_method = 'email'
                user.save()
            else:
                # Defensive, though validate_email should have caught this
                return Response({'error': 'User already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate 6-digit OTP valid for 10 minutes
        from random import randint
        from django.utils import timezone
        from datetime import timedelta

        # Invalidate older unused OTPs to avoid confusion
        EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        code = f"{randint(0, 999999):06d}"
        expires_at = timezone.now() + timedelta(minutes=10)
        otp = EmailOTP.objects.create(user=user, code=code, expires_at=expires_at)

        # Send email; return error if delivery fails
        subject = "Your EasyLearnova verification code"
        html = f"""
        <html><body>
          <p>Hi {full_name},</p>
          <p>Your verification code is:</p>
          <p style='font-size:24px;letter-spacing:4px'><strong>{code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, you can ignore this email.</p>
          <p>— EasyLearnova</p>
        </body></html>
        """
        sent = send_email_via_smtp(user.email, subject, html)
        if not sent:
            # Prevent stale code confusion
            otp.mark_used()
            logger.error("OTP email delivery failed during signup")
            return Response({'error': 'Failed to send verification email. Please try again later.'}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'message': 'OTP sent to email.'}, status=status.HTTP_200_OK)
    except Exception as e:
        # Catch-all to prevent 500 without CORS headers
        logger.exception(f"otp_signup exception: {e}")
        return Response({'error': 'Signup failed due to server error. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def otp_verify(request):
    """Verify OTP; activate user and return JWT tokens."""
    serializer = OTPVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data['user']
    code = serializer.validated_data['code']

    # Get latest unused, unexpired OTP
    from django.utils import timezone
    otp = EmailOTP.objects.filter(user=user, is_used=False, expires_at__gt=timezone.now()).order_by('-created_at').first()
    if not otp or otp.code != code:
        return Response({'error': 'Invalid or expired code.'}, status=status.HTTP_400_BAD_REQUEST)

    # Mark used and activate user
    otp.mark_used()
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=['is_active'])

    # Issue tokens
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def otp_resend(request):
    """Resend OTP with basic rate limiting: max 3 per 30 minutes."""
    serializer = OTPResendSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].lower()
    user = serializer.context['user']  # set in validate_email
    if user.is_active:
        return Response({'error': 'User already verified.'}, status=status.HTTP_400_BAD_REQUEST)

    from django.utils import timezone
    from datetime import timedelta
    now = timezone.now()

    # Rate limit: read last OTP
    last_otp = EmailOTP.objects.filter(user=user).order_by('-created_at').first()
    if last_otp and last_otp.last_sent_at and last_otp.last_sent_at > now - timedelta(minutes=1):
        return Response({'error': 'Please wait a minute before requesting another code.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    # Count resends in rolling 30 min window
    window_start = now - timedelta(minutes=30)
    resend_count = EmailOTP.objects.filter(user=user, created_at__gte=window_start).count()
    if resend_count >= 3:
        return Response({'error': 'Too many requests. Try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # Invalidate older codes
    EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)

    # New code
    from random import randint
    code = f"{randint(0, 999999):06d}"
    expires_at = now + timedelta(minutes=10)
    otp = EmailOTP.objects.create(user=user, code=code, expires_at=expires_at, resend_count=0)
    # Update last_sent
    otp.last_sent_at = now
    otp.save(update_fields=['last_sent_at'])

    # Email
    subject = "Your EasyLearnova verification code"
    html = f"""
    <html><body>
      <p>Hi {user.full_name},</p>
      <p>Your new verification code is:</p>
      <p style='font-size:24px;letter-spacing:4px'><strong>{code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, you can ignore this email.</p>
      <p>— EasyLearnova</p>
    </body></html>
    """
    sent = send_email_via_smtp(user.email, subject, html)
    if not sent:
        otp.mark_used()
        if getattr(settings, 'DEBUG', False):
            logger.error("OTP email delivery failed during resend")
        return Response({'error': 'Unable to resend code right now. Please try again later.'}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({'message': 'OTP resent to email.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def smtp_test(request):
    """DEBUG-only: Attempt to send a test email via different SMTP modes and report results.
    Body: { "to": "you@example.com" }
    """
    if not getattr(settings, 'DEBUG', False):
        return Response(status=status.HTTP_404_NOT_FOUND)

    to_email = request.data.get('to')
    if not to_email:
        return Response({'error': 'Missing `to` in body'}, status=status.HTTP_400_BAD_REQUEST)

    smtp_host = getattr(settings, 'SMTP_HOST', '')
    smtp_user = getattr(settings, 'SMTP_USERNAME', '')
    smtp_pass = getattr(settings, 'SMTP_PASSWORD', '')
    results = []

    def _attempt(mode: str, port: int):
        try:
            # quick TCP connectivity probe
            with socket.create_connection((smtp_host, port), timeout=6):
                pass
        except Exception as e:
            results.append({'mode': mode, 'port': port, 'ok': False, 'stage': 'connect', 'error': str(e)})
            return False

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"SMTP test via {mode.upper()}:{port}"
            msg['From'] = smtp_user
            msg['To'] = to_email
            msg.attach(MIMEText('<p>This is a test email from SMTP diagnostics.</p>', 'html'))

            if mode == 'ssl':
                with smtplib.SMTP_SSL(smtp_host, port, timeout=10) as server:
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
            elif mode == 'tls':
                with smtplib.SMTP(smtp_host, port, timeout=10) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(smtp_host, port, timeout=10) as server:
                    server.ehlo()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)

            results.append({'mode': mode, 'port': port, 'ok': True})
            return True
        except Exception as e:
            results.append({'mode': mode, 'port': port, 'ok': False, 'stage': 'send', 'error': str(e)})
            return False

    sent_mode = None
    # Try configured path first
    use_ssl = getattr(settings, 'SMTP_USE_SSL', True)
    use_tls = getattr(settings, 'SMTP_USE_TLS', False)
    port_cfg = int(getattr(settings, 'SMTP_PORT', 465))

    if use_ssl and _attempt('ssl', port_cfg):
        sent_mode = f'ssl:{port_cfg}'
    elif use_tls and _attempt('tls', port_cfg):
        sent_mode = f'tls:{port_cfg}'
    else:
        # Fallback common ports
        if not sent_mode and _attempt('tls', 587):
            sent_mode = 'tls:587'
        if not sent_mode and _attempt('ssl', 465):
            sent_mode = 'ssl:465'

    if getattr(settings, 'DEBUG', False):
        logger.debug(f"SMTP diagnostics results: {results}; sent_mode={sent_mode}")
    return Response({'results': results, 'sent_mode': sent_mode}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def admin_login(request):
    """
    Admin login endpoint that only allows Django superusers to authenticate
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {"error": "Email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Authenticate against the configured AUTH_USER_MODEL. Support both email and username params.
        user = authenticate(request=request, email=email, password=password)
        if not user:
            user = authenticate(request=request, username=email, password=password)
        
        if not user:
            if getattr(settings, 'DEBUG', False):
                logger.error(f"Admin login failed - invalid credentials for: {email}")
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is a superuser
        if not getattr(user, 'is_superuser', False):
            if getattr(settings, 'DEBUG', False):
                logger.error(f"Admin login failed - user {email} is not a superuser")
            return Response(
                {"error": "Access denied. Only superusers can access the admin panel."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user.is_active:
            if getattr(settings, 'DEBUG', False):
                logger.error(f"Admin login failed - user {email} is inactive")
            return Response(
                {"error": "Account is disabled"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens for the admin user
        refresh = RefreshToken.for_user(user)
        if getattr(settings, 'DEBUG', False):
            logger.debug("Admin login successful for superuser")
        
        return Response({
            'message': 'Admin login successful',
            'user': {
                'id': user.id,
                'username': getattr(user, 'username', '') or getattr(user, 'email', ''),
                'email': getattr(user, 'email', ''),
                'is_superuser': bool(getattr(user, 'is_superuser', False)),
                'is_staff': bool(getattr(user, 'is_staff', False)),
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        if getattr(settings, 'DEBUG', False):
            logger.exception(f"Admin login error: {str(e)}")
        return Response(
            {"error": "An error occurred during login"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_admin_token(request):
    """
    Verify if the current JWT token belongs to a superuser
    This should be called on protected admin routes
    """
    try:
        user = request.user
        
        # Check if user is still a superuser and active
        if not user.is_superuser:
            return Response(
                {"error": "Access denied. Superuser privileges required."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user.is_active:
            return Response(
                {"error": "Account is disabled"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            'valid': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        if getattr(settings, 'DEBUG', False):
            logger.exception(f"Admin token verification error: {str(e)}")
        return Response(
            {"error": "Token verification failed"},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_users(request):
    """
    Admin-only endpoint to list users with basic filters and pagination.
    Query params:
      - q: search string (matches email or full_name)
      - status: active|inactive|all
      - page: 1-based page index (default 1)
      - page_size: page size (default 10, max 100)
    """
    try:
        # Ensure only superusers can access
        if not request.user.is_superuser:
            return Response({"error": "Access denied. Superuser privileges required."}, status=status.HTTP_403_FORBIDDEN)

        q = (request.GET.get('q') or '').strip()
        status_filter = (request.GET.get('status') or 'all').strip().lower()
        try:
            page = max(int(request.GET.get('page', '1') or '1'), 1)
        except Exception:
            page = 1
        try:
            page_size = int(request.GET.get('page_size', '10') or '10')
        except Exception:
            page_size = 10
        page_size = max(1, min(page_size, 100))

        # Order admins first by default, then newest users
        queryset = User.objects.all().order_by('-is_superuser', '-date_joined')

        if q:
            queryset = queryset.filter(Q(email__icontains=q) | Q(full_name__icontains=q))

        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = list(queryset[start:end])

        # Stats
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        from django.utils import timezone
        now = timezone.now()
        new_this_month = User.objects.filter(date_joined__year=now.year, date_joined__month=now.month).count()
        inactive_users = total_users - active_users

        payload = {
            'results': [
                {
                    'id': u.id,
                    'name': (u.full_name or '').strip() or u.email,
                    'email': u.email,
                    'status': 'active' if u.is_active else 'inactive',
                    'is_superuser': bool(getattr(u, 'is_superuser', False)),
                    'enrolledCourses': 0,
                    'joinDate': u.date_joined.isoformat() if getattr(u, 'date_joined', None) else None,
                }
                for u in items
            ],
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': total,
                'has_next': end < total,
                'has_prev': start > 0,
            },
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'new_this_month': new_this_month,
                'inactive_users': inactive_users,
            },
        }

        return Response(payload, status=status.HTTP_200_OK)
    except Exception as e:
        if getattr(settings, 'DEBUG', False):
            logger.exception(f"Admin users list error: {str(e)}")
        return Response({"error": "Failed to fetch users"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id: int):
    """Admin-only: get, update, or delete a user."""
    try:
        if not request.user.is_superuser:
            return Response({"error": "Access denied. Superuser privileges required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            data = {
                'id': target.id,
                'email': target.email,
                'full_name': target.full_name,
                'is_active': target.is_active,
                'is_superuser': target.is_superuser,
                'date_joined': target.date_joined.isoformat() if target.date_joined else None,
            }
            return Response(data, status=status.HTTP_200_OK)

        if request.method == 'PATCH':
            payload = request.data or {}
            allowed_fields = ['full_name', 'email', 'is_active', 'is_superuser']
            updated = False

            # Prevent removing your own superuser status accidentally
            if 'is_superuser' in payload and request.user.id == target.id and not bool(payload['is_superuser']):
                return Response({"error": "You cannot remove your own admin privileges."}, status=status.HTTP_400_BAD_REQUEST)

            # Apply updates
            if 'full_name' in payload:
                target.full_name = str(payload['full_name']).strip() or target.full_name
                updated = True
            if 'email' in payload and payload['email']:
                new_email = str(payload['email']).strip().lower()
                if new_email != target.email and User.objects.filter(email=new_email).exclude(pk=target.pk).exists():
                    return Response({"error": "Email already in use"}, status=status.HTTP_400_BAD_REQUEST)
                target.email = new_email
                updated = True
            if 'is_active' in payload:
                target.is_active = bool(payload['is_active'])
                updated = True
            if 'is_superuser' in payload:
                target.is_superuser = bool(payload['is_superuser'])
                # ensure staff flag follows superuser
                if target.is_superuser:
                    target.is_staff = True
                updated = True

            if updated:
                target.save()

            return Response({"success": True}, status=status.HTTP_200_OK)

        if request.method == 'DELETE':
            # Guard: don't delete yourself
            if request.user.id == target.id:
                return Response({"error": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)
            # Guard: ensure at least one superuser remains
            if target.is_superuser and User.objects.filter(is_superuser=True).count() <= 1:
                return Response({"error": "Cannot delete the last remaining admin."}, status=status.HTTP_400_BAD_REQUEST)

            target.delete()
            return Response({"success": True}, status=status.HTTP_200_OK)

        return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    except Exception as e:
        if getattr(settings, 'DEBUG', False):
            logger.exception(f"Admin user detail error: {str(e)}")
        return Response({"error": "Operation failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_set_user_password(request, user_id: int):
    """Admin-only endpoint to set/reset a user's password.
    Request body: { "new_password": string }
    """
    try:
        if not request.user.is_superuser:
            return Response({"error": "Access denied. Superuser privileges required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data or {}
        new_password = (payload.get('new_password') or '').strip()
        if not new_password:
            return Response({"error": "New password is required"}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)

        # Basic weak password guard
        weak = {"password", "12345678", "qwertyui", "letmein!", "abcdefgh"}
        if new_password.lower() in weak:
            return Response({"error": "Please choose a stronger password"}, status=status.HTTP_400_BAD_REQUEST)

        target.set_password(new_password)
        target.save()
        return Response({"success": True}, status=status.HTTP_200_OK)
    except Exception as e:
        if getattr(settings, 'DEBUG', False):
            logger.exception(f"Admin set password error: {str(e)}")
        return Response({"error": "Failed to update password"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def google_auth_url(request):
    """
    Generate Google OAuth2 authentication URL
    """
    if not settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY:
        return Response(
            {"error": "Google OAuth2 not configured"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    redirect_uri = request.build_absolute_uri('/api/auth/google/callback/')
    state = request.GET.get('state', 'default_state')
    
    params = {
        'client_id': settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
        'redirect_uri': redirect_uri,
        'scope': ' '.join(settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE),
        'response_type': 'code',
        'state': state,
        'access_type': 'offline',
        'prompt': 'consent'
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"
    
    return Response({
        'auth_url': auth_url,
        'redirect_uri': redirect_uri
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def google_auth_callback(request):
    """
    Handle Google OAuth2 callback and exchange code for tokens
    Integrates with existing User model and authentication system
    """
    code = request.data.get('code')
    if not code:
        return Response(
            {"error": "Authorization code is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Exchange authorization code for access token
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = request.build_absolute_uri('/api/auth/google/callback/')
        
        token_data = {
            'client_id': settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            'client_secret': settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri,
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if 'error' in token_json:
            return Response(
                {"error": f"Token exchange failed: {token_json.get('error_description', 'Unknown error')}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        access_token = token_json.get('access_token')
        
        # Get user info from Google
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        user_response = requests.get(user_info_url)
        user_data = user_response.json()
        
        if 'error' in user_data:
            return Response(
                {"error": "Failed to fetch user information from Google"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user information
        email = user_data.get('email')
        if not email:
            return Response(
                {"error": "Email not provided by Google"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build full_name from Google data
        first_name = user_data.get('given_name', '')
        last_name = user_data.get('family_name', '')
        full_name = f"{first_name} {last_name}".strip()
        
        if not full_name:
            full_name = user_data.get('name', '')
        
        if not full_name:
            # Fallback: use email prefix
            full_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        
        # Check if user exists, create if not using your UserManager
        try:
            user = User.objects.get(email=email)
            created = False
            logger.info(f"Google auth: Existing user found - {email}")
        except User.DoesNotExist:
            # Create new user using your custom UserManager.create_user method
            try:
                user = User.objects.create_user(
                    email=email,
                    full_name=full_name,
                    agreed_to_terms=True  # Google users implicitly agree
                )
                created = True
                logger.info(f"Google auth: New user created - {email}")
            except Exception as e:
                logger.error(f"Error creating user: {str(e)}")
                return Response(
                    {"error": "Failed to create user account"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Ensure user is active
        if not user.is_active:
            return Response(
                {"error": "User account is disabled"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens using the same method as your regular login
        refresh = RefreshToken.for_user(user)
        
        # Return the same format as your existing login endpoint
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'created': created,
            'message': 'Google authentication successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Google auth callback error: {str(e)}")
        return Response(
            {"error": "Authentication failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  
@authentication_classes([])
@db_retry_on_connection_error(max_retries=3, delay=0.5, backoff=2)  # Auto-retry on connection errors
def google_auth_token(request):
    """
    Authenticate user directly with Google access token
    Useful for frontend implementations that already have Google tokens
    Integrates perfectly with existing User model and authentication system
    
    CRITICAL: Wrapped with @db_retry_on_connection_error for Render + Hostinger MySQL setup
    """
    access_token = request.data.get('access_token')
    # Google Identity Services may send this as 'id_token' or 'credential'
    id_token = request.data.get('id_token') or request.data.get('credential')
    
    # Use ID token if available, otherwise fallback to access token
    token_to_verify = id_token or access_token
    
    if not token_to_verify:
        return Response(
            {"error": "Access token or ID token is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_data = None
        
        # Try to handle ID token first (from Google Sign-In button)
        if id_token:
            try:
                # Prefer Google's tokeninfo endpoint for robust validation
                tokeninfo_url = "https://oauth2.googleapis.com/tokeninfo"
                ti_resp = requests.get(tokeninfo_url, params={"id_token": id_token}, timeout=5)
                if ti_resp.status_code == 200:
                    user_data = ti_resp.json()
                else:
                    # Fallback to local decode (no signature verification)
                    import base64
                    import json
                    payload = id_token.split('.')[1]
                    padding = '=' * (-len(payload) % 4)
                    decoded = base64.urlsafe_b64decode(payload + padding)
                    user_data = json.loads(decoded)

                # Verify token is for our client
                if user_data.get('aud') != settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY:
                    return Response(
                        {"error": "invalid_audience"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                    
            except Exception as e:
                logger.error(f"ID token verification failed: {str(e)}")
                # Fallback to access token method
                user_data = None
        
        # If ID token failed or not provided, use access token
        if not user_data and access_token:
            user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
            user_response = requests.get(user_info_url)
            
            if user_response.status_code != 200:
                return Response(
                    {"error": "Invalid access token"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            user_data = user_response.json()
        
        if not user_data:
            return Response(
                {"error": "invalid_token", "detail": "Failed to verify Google token"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user information (handle both ID token and userinfo response formats)
        email = user_data.get('email')
        if not email:
            return Response(
                {"error": "email_missing", "detail": "Email not provided by Google"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build full_name from available data
        first_name = user_data.get('given_name', '')
        last_name = user_data.get('family_name', '')
        full_name = f"{first_name} {last_name}".strip()
        
        if not full_name:
            full_name = user_data.get('name', '')
        
        if not full_name:
            # Fallback: use email prefix
            full_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        
        # Check if user exists, create if not using your UserManager
        try:
            user = User.objects.get(email=email)
            created = False
            logger.info(f"Google token auth: Existing user found - {email}")
        except User.DoesNotExist:
            # Create new user using your custom UserManager.create_user method
            try:
                user = User.objects.create_user(
                    email=email,
                    full_name=full_name,
                    auth_method='google',  # Set auth method for Google users
                    agreed_to_terms=True  # Google users implicitly agree
                )
                created = True
                logger.info(f"Google token auth: New user created - {email}")
            except Exception as e:
                logger.error(f"Error creating user: {str(e)}")
                return Response(
                    {"error": "Failed to create user account"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Ensure user is active
        if not user.is_active:
            return Response(
                {"error": "User account is disabled"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens using the same method as your regular login
        refresh = RefreshToken.for_user(user)
        
        # Return the same format as your existing login endpoint for consistency
        response_data = {
            'user': UserSerializer(user).data,
            'refresh': str(refresh),  # Keep same format as LoginView
            'access': str(refresh.access_token),  # Keep same format as LoginView
            'created': created,
            'message': 'Google authentication successful'
        }
        
        logger.info(f"Google authentication successful for user: {user.email}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Google token auth error: {str(e)}")
        return Response(
            {"error": "Authentication failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Custom token generator for password reset
class AccountActivationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return (
            str(user.pk) + str(timestamp) +
            str(user.email) + str(user.password)
        )

token_generator = AccountActivationTokenGenerator()


def send_password_reset_email(user_email, uid, token, is_admin=False):
    """Send password reset email using Gmail SMTP"""
    try:
        # Email configuration
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "easylearnova@gmail.com"
        sender_password = "cedr hdik avgu gllp"
        
        # Create reset URL - different for admin vs regular users
        frontend_domain = getattr(settings, 'FRONTEND_DOMAIN', 'http://localhost:5173')
        if is_admin:
            reset_url = f"{frontend_domain}/admin-p/reset-password/{uid}/{token}"
            subject = "Admin Password Reset Request - EasyLearnova"
            title = "🔐 Admin Password Reset"
        else:
            reset_url = f"{frontend_domain}/reset-password/{uid}/{token}"
            subject = "Password Reset Request - EasyLearnova"
            title = "🎓 Password Reset"
        
        # Email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                .admin-badge {{ background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{title}</h1>
                    {f'<div class="admin-badge">ADMIN ACCOUNT</div>' if is_admin else ''}
                    <h2>Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Hello{' Administrator' if is_admin else ''}!</p>
                    <p>We received a request to reset your {'admin ' if is_admin else ''}password for your EasyLearnova account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="{reset_url}" class="button">Reset Password</a>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">{reset_url}</p>
                    <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
                    {f'<p><strong>Security Notice:</strong> This is an admin account reset. Please ensure you requested this change.</p>' if is_admin else ''}
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                    <p>Best regards,<br>The EasyLearnova Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 EasyLearnova. Empowering learners worldwide.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = user_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        
        logger.info(f"Password reset email sent successfully to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def forgot_password(request):
    """Handle forgot password request"""
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Always return success message for security (don't reveal if email exists)
        success_message = "If that email exists in our system, we've sent a password reset link to your inbox."
        
        try:
            user = User.objects.get(email=email)
            
            # Generate token and uid
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = token_generator.make_token(user)
            
            # Send email
            email_sent = send_password_reset_email(user.email, uid, token)
            
            if email_sent:
                logger.info(f"Password reset initiated for user: {email}")
            else:
                logger.error(f"Failed to send reset email for user: {email}")
                
        except User.DoesNotExist:
            # Don't reveal that email doesn't exist - security best practice
            logger.info(f"Password reset attempted for non-existent email: {email}")
            pass
        
        return Response({
            'message': success_message
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in forgot_password: {str(e)}")
        return Response({
            'error': 'An error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def admin_forgot_password(request):
    """Handle admin forgot password request - only for superuser accounts"""
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Always return success message for security (don't reveal if email exists)
        success_message = "If that email belongs to an admin account, we've sent a password reset link to your inbox."
        
        try:
            # Check if user exists AND is a superuser
            user = User.objects.get(email=email, is_superuser=True)
            
            # Generate token and uid
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = token_generator.make_token(user)
            
            # Send admin-specific email
            email_sent = send_password_reset_email(user.email, uid, token, is_admin=True)
            
            if email_sent:
                logger.info(f"Admin password reset initiated for user: {email}")
            else:
                logger.error(f"Failed to send admin reset email for user: {email}")
                
        except User.DoesNotExist:
            # Don't reveal that email doesn't exist or isn't an admin - security best practice
            logger.info(f"Admin password reset attempted for non-existent/non-admin email: {email}")
            pass
        
        return Response({
            'message': success_message
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in admin_forgot_password: {str(e)}")
        return Response({
            'error': 'An error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password(request):
    """Handle password reset with token validation"""
    try:
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validation
        if not all([uid, token, new_password, confirm_password]):
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Password strength validation
        if len(new_password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for at least one uppercase, one lowercase, one digit
        import re
        if not re.search(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$', new_password):
            return Response({
                'error': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Decode user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Validate token
            if not token_generator.check_token(user, token):
                return Response({
                    'error': 'Invalid or expired reset link. Please request a new password reset.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update password
            user.set_password(new_password)
            user.save()
            
            logger.info(f"Password successfully reset for user: {user.email}")
            
            return Response({
                'message': 'Password reset successfully! You can now log in with your new password.'
            }, status=status.HTTP_200_OK)
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                'error': 'Invalid reset link. Please request a new password reset.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error in reset_password: {str(e)}")
        return Response({
            'error': 'An error occurred. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def validate_reset_token(request, uid, token):
    """Validate reset token without resetting password"""
    try:
        # Decode user ID
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        
        # Validate token
        if token_generator.check_token(user, token):
            return Response({
                'valid': True,
                'email': user.email
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'valid': False,
                'error': 'Invalid or expired reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            'valid': False,
            'error': 'Invalid reset link'
        }, status=status.HTTP_400_BAD_REQUEST)


# Custom Token Refresh View with database retry logic
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

class TokenRefreshViewWithRetry(BaseTokenRefreshView):
    """
    Custom Token Refresh View with automatic retry on database connection errors.
    CRITICAL for Render + Hostinger MySQL setup where connections may drop.
    """
    
    @db_retry_on_connection_error(max_retries=3, delay=0.5, backoff=2)
    def post(self, request, *args, **kwargs):
        """
        Override post method to add database connection retry logic.
        This ensures token refresh works even if MySQL connection is temporarily lost.
        """
        return super().post(request, *args, **kwargs)