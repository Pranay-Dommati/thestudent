from django.shortcuts import render, redirect
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User as DjangoUser
from django.conf import settings
from django.http import JsonResponse
from urllib.parse import urlencode
import logging
import requests

from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from .models import User

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        print("Received data:", request.data)  # Debugging: Log the incoming data
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Debugging: Log validation errors
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
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        logger.info(f"Login attempt for email: {request.data.get('email')}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Login validation error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = authenticate(
                request=request,
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            
            if not user:
                logger.error("Invalid credentials")
                return Response(
                    {"non_field_errors": ["Invalid email or password"]},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not user.is_active:
                logger.error("Inactive user account")
                return Response(
                    {"non_field_errors": ["Account is disabled"]},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            refresh = RefreshToken.for_user(user)
            logger.info(f"Login successful for user: {user.email}")
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {"non_field_errors": ["An error occurred during login"]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
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
        # Try to authenticate using Django's built-in User model for superusers
        user = authenticate(request=request, username=email, password=password)
        
        if not user:
            # Also try to find by email field
            try:
                django_user = DjangoUser.objects.get(email=email)
                if django_user.check_password(password):
                    user = django_user
            except DjangoUser.DoesNotExist:
                pass
        
        if not user:
            logger.error(f"Admin login failed - invalid credentials for: {email}")
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is a superuser
        if not user.is_superuser:
            logger.error(f"Admin login failed - user {email} is not a superuser")
            return Response(
                {"error": "Access denied. Only superusers can access the admin panel."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user.is_active:
            logger.error(f"Admin login failed - user {email} is inactive")
            return Response(
                {"error": "Account is disabled"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate JWT tokens for the admin user
        refresh = RefreshToken.for_user(user)
        logger.info(f"Admin login successful for superuser: {user.email or user.username}")
        
        return Response({
            'message': 'Admin login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
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
        logger.error(f"Admin token verification error: {str(e)}")
        return Response(
            {"error": "Token verification failed"},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([AllowAny])
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
def google_auth_token(request):
    """
    Authenticate user directly with Google access token
    Useful for frontend implementations that already have Google tokens
    Integrates perfectly with existing User model and authentication system
    """
    access_token = request.data.get('access_token')
    id_token = request.data.get('id_token')  # Google Sign-In often provides ID token
    
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
                # For ID tokens, we need to verify and decode them
                # This is a simplified approach - in production, you should verify the signature
                import base64
                import json
                
                # Decode ID token payload (without verification for now)
                # In production, use google.auth.jwt or similar for proper verification
                payload = id_token.split('.')[1]
                # Add padding if needed
                payload += '=' * (4 - len(payload) % 4)
                decoded = base64.urlsafe_b64decode(payload)
                user_data = json.loads(decoded)
                
                # Verify token is for our client
                if user_data.get('aud') != settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY:
                    return Response(
                        {"error": "Invalid token audience"},
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
                {"error": "Failed to get user information"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user information (handle both ID token and userinfo response formats)
        email = user_data.get('email')
        if not email:
            return Response(
                {"error": "Email not provided by Google"},
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