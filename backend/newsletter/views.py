from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
import json
from .models import Newsletter

class NewsletterAPIView(APIView):
    """
    API View for handling newsletter subscriptions
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = request.data if hasattr(request, 'data') else json.loads(request.body)
            
            # Extract email
            email = data.get('email', '').strip().lower()
            
            # Validation
            if not email:
                return JsonResponse({
                    'success': False,
                    'message': 'Email is required'
                }, status=400)
            
            # Basic email validation
            if '@' not in email or '.' not in email:
                return JsonResponse({
                    'success': False,  
                    'message': 'Please enter a valid email address'
                }, status=400)
            
            # Check if email already exists (make idempotent)
            if Newsletter.objects.filter(email=email).exists():
                return Response({
                    'success': True,
                    'message': 'You are already subscribed to our newsletter.'
                }, status=200)
            
            # Create newsletter subscription
            newsletter = Newsletter.objects.create(email=email)
            
            return Response({
                'success': True,
                'message': 'Successfully subscribed to newsletter!',
                'data': {
                    'id': newsletter.id,
                    'email': newsletter.email,
                    'subscribed_at': newsletter.subscribed_at.isoformat()
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return Response({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        
        except Exception as e:
            return Response({
                'success': False,
                'message': 'An error occurred while processing your subscription'
            }, status=500)
    
    def get(self, request):
        """
        Get all newsletter subscriptions for admin dashboard
        """
        self.permission_classes = [IsAdminUser]
        try:
            newsletters = Newsletter.objects.all().order_by('-subscribed_at')
            newsletter_list = []
            
            for newsletter in newsletters:
                newsletter_list.append({
                    'id': newsletter.id,
                    'email': newsletter.email,
                    'subscribed_at': newsletter.subscribed_at.isoformat(),
                    'is_active': newsletter.is_active
                })
            
            return Response(newsletter_list, status=200)
            
        except Exception as e:
            return Response({
                'error': 'Failed to fetch newsletter subscriptions'
            }, status=500)


class NewsletterDetailAPIView(APIView):
    """
    API View for handling individual newsletter operations
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    
    def delete(self, request, newsletter_id):
        """
        Delete a specific newsletter subscription
        """
        try:
            newsletter = Newsletter.objects.get(id=newsletter_id)
            newsletter.delete()
            
            return Response({
                'success': True,
                'message': 'Newsletter subscription deleted successfully'
            }, status=200)
            
        except Newsletter.DoesNotExist:
            return Response({
                'error': 'Newsletter subscription not found'
            }, status=404)
        except Exception as e:
            return Response({
                'error': 'Failed to delete newsletter subscription'
            }, status=500)

    def patch(self, request, newsletter_id):
        """
        Update newsletter subscription status (activate/deactivate)
        """
        try:
            data = request.data if hasattr(request, 'data') else json.loads(request.body)
            newsletter = Newsletter.objects.get(id=newsletter_id)
            
            if 'is_active' in data:
                newsletter.is_active = data['is_active']
                newsletter.save()
            
            return Response({
                'success': True,
                'message': 'Newsletter subscription updated successfully',
                'data': {
                    'id': newsletter.id,
                    'email': newsletter.email,
                    'is_active': newsletter.is_active
                }
            }, status=200)
            
        except Newsletter.DoesNotExist:
            return Response({
                'error': 'Newsletter subscription not found'
            }, status=404)
        except Exception as e:
            return Response({
                'error': 'Failed to update newsletter subscription'
            }, status=500)
