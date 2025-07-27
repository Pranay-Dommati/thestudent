from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.utils import timezone
import json
from .models import Newsletter

@method_decorator(csrf_exempt, name='dispatch')
class NewsletterAPIView(View):
    """
    API View for handling newsletter subscriptions
    """
    
    def post(self, request):
        try:
            # Parse JSON data from request body
            data = json.loads(request.body)
            
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
            
            # Check if email already exists
            if Newsletter.objects.filter(email=email).exists():
                return JsonResponse({
                    'success': False,
                    'message': 'This email is already subscribed to our newsletter'
                }, status=400)
            
            # Create newsletter subscription
            newsletter = Newsletter.objects.create(email=email)
            
            return JsonResponse({
                'success': True,
                'message': 'Successfully subscribed to newsletter!',
                'data': {
                    'id': newsletter.id,
                    'email': newsletter.email,
                    'subscribed_at': newsletter.subscribed_at.isoformat()
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
                'message': 'An error occurred while processing your subscription'
            }, status=500)
    
    def get(self, request):
        """
        Get all newsletter subscriptions for admin dashboard
        """
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
            
            return JsonResponse(newsletter_list, safe=False)
            
        except Exception as e:
            return JsonResponse({
                'error': 'Failed to fetch newsletter subscriptions'
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class NewsletterDetailAPIView(View):
    """
    API View for handling individual newsletter operations
    """
    
    def delete(self, request, newsletter_id):
        """
        Delete a specific newsletter subscription
        """
        try:
            newsletter = Newsletter.objects.get(id=newsletter_id)
            newsletter.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Newsletter subscription deleted successfully'
            })
            
        except Newsletter.DoesNotExist:
            return JsonResponse({
                'error': 'Newsletter subscription not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'error': 'Failed to delete newsletter subscription'
            }, status=500)

    def patch(self, request, newsletter_id):
        """
        Update newsletter subscription status (activate/deactivate)
        """
        try:
            data = json.loads(request.body)
            newsletter = Newsletter.objects.get(id=newsletter_id)
            
            if 'is_active' in data:
                newsletter.is_active = data['is_active']
                newsletter.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Newsletter subscription updated successfully',
                'data': {
                    'id': newsletter.id,
                    'email': newsletter.email,
                    'is_active': newsletter.is_active
                }
            })
            
        except Newsletter.DoesNotExist:
            return JsonResponse({
                'error': 'Newsletter subscription not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'error': 'Failed to update newsletter subscription'
            }, status=500)
