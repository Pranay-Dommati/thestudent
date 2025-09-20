from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from datetime import timedelta
import json
from .models import Feedback

class FeedbackAPIView(APIView):
    """
    API View for handling feedback submissions
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = request.data if hasattr(request, 'data') else json.loads(request.body)
            
            # Extract data
            name = data.get('name', '').strip()
            message = data.get('message', '').strip()
            
            # Validation
            if not name:
                return JsonResponse({
                    'success': False,
                    'message': 'Name is required'
                }, status=400)
            
            if not message:
                return JsonResponse({
                    'success': False,
                    'message': 'Feedback message is required'
                }, status=400)
            
            if len(name) > 100:
                return JsonResponse({
                    'success': False,
                    'message': 'Name must be less than 100 characters'
                }, status=400)
            
            if len(message) > 2000:
                return JsonResponse({
                    'success': False,
                    'message': 'Message must be less than 2000 characters'
                }, status=400)
            
            # Create feedback entry
            feedback = Feedback.objects.create(
                name=name,
                message=message
            )
            
            return Response({
                'success': True,
                'message': 'Feedback submitted successfully!',
                'data': {
                    'id': feedback.id,
                    'name': feedback.name,
                    'submitted_at': feedback.submitted_at.isoformat()
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
                'message': 'An error occurred while processing your feedback'
            }, status=500)
    
    def get(self, request):
        """
        Get all feedbacks for admin dashboard
        """
        self.permission_classes = [IsAdminUser]
        try:
            feedbacks = Feedback.objects.all().order_by('-submitted_at')
            feedback_list = []
            
            for feedback in feedbacks:
                feedback_list.append({
                    'id': feedback.id,
                    'name': feedback.name,
                    'message': feedback.message,
                    'submitted_at': feedback.submitted_at.isoformat()
                })
            
            return Response(feedback_list, status=200)
            
        except Exception as e:
            return Response({
                'error': 'Failed to fetch feedbacks'
            }, status=500)


class FeedbackDetailAPIView(APIView):
    """
    API View for handling individual feedback operations
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]
    
    def delete(self, request, feedback_id):
        """
        Delete a specific feedback
        """
        try:
            feedback = Feedback.objects.get(id=feedback_id)
            feedback.delete()
            
            return Response({
                'success': True,
                'message': 'Feedback deleted successfully'
            }, status=200)
            
        except Feedback.DoesNotExist:
            return Response({
                'error': 'Feedback not found'
            }, status=404)
        except Exception as e:
            return Response({
                'error': 'Failed to delete feedback'
            }, status=500)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def submit_feedback(request):
    """Function-based view for feedback submission using DRF."""
    try:
        data = request.data
        name = data.get('name', '').strip()
        message = data.get('message', '').strip()

        if not name or not message:
            return Response({
                'success': False,
                'message': 'Name and message are required'
            }, status=400)

        feedback = Feedback.objects.create(
            name=name,
            message=message
        )

        return Response({
            'success': True,
            'message': 'Thank you for your feedback!',
            'id': feedback.id
        }, status=201)
    except Exception:
        return Response({
            'success': False,
            'message': 'Failed to submit feedback'
        }, status=500)
