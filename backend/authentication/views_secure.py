from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.contrib.auth.models import User as DjangoUser
import logging

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
