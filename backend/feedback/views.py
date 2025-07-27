from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.utils import timezone
from datetime import timedelta
import json
from .models import Feedback

@method_decorator(csrf_exempt, name='dispatch')
class FeedbackAPIView(View):
    """
    API View for handling feedback submissions
    """
    
    def post(self, request):
        try:
            # Parse JSON data from request body
            data = json.loads(request.body)
            
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
            
            return JsonResponse({
                'success': True,
                'message': 'Feedback submitted successfully!',
                'data': {
                    'id': feedback.id,
                    'name': feedback.name,
                    'submitted_at': feedback.submitted_at.isoformat()
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': 'An error occurred while processing your feedback'
            }, status=500)
    
    def get(self, request):
        """
        Get all feedbacks for admin dashboard
        """
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
            
            return JsonResponse(feedback_list, safe=False)
            
        except Exception as e:
            return JsonResponse({
                'error': 'Failed to fetch feedbacks'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackDetailAPIView(View):
    """
    API View for handling individual feedback operations
    """
    
    def delete(self, request, feedback_id):
        """
        Delete a specific feedback
        """
        try:
            feedback = Feedback.objects.get(id=feedback_id)
            feedback.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Feedback deleted successfully'
            })
            
        except Feedback.DoesNotExist:
            return JsonResponse({
                'error': 'Feedback not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'error': 'Failed to delete feedback'
            }, status=500)


# Alternative function-based view (if preferred)
@csrf_exempt
@require_http_methods(["POST"])
def submit_feedback(request):
    """
    Function-based view for feedback submission
    """
    try:
        data = json.loads(request.body)
        
        name = data.get('name', '').strip()
        message = data.get('message', '').strip()
        
        if not name or not message:
            return JsonResponse({
                'success': False,
                'message': 'Name and message are required'
            }, status=400)
        
        feedback = Feedback.objects.create(
            name=name,
            message=message
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Thank you for your feedback!',
            'id': feedback.id
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Failed to submit feedback'
        }, status=500)
