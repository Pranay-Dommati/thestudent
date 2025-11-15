"""
Alternative implementation using Django JsonResponse instead of DRF
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.db import transaction
import json

from .models import ProLearningCourse, ProLearningTopic, ProLearningVideo, ProLearningQuizQuestion, ProLearningResource

@csrf_exempt
@require_http_methods(["POST"])
def save_course_from_localStorage_simple(request):
    """
    Alternative implementation using basic Django views
    POST /api/courses/pro-learning/save-from-storage-simple/
    """
    try:
        # Parse JSON data
        data = json.loads(request.body)
        
        course_id = data.get('course_id')
        title = data.get('title')
        topics_data = data.get('topics', {})
        
        if not course_id or not title:
            return JsonResponse({
                'error': 'course_id and title are required'
            }, status=400)
        
        # For now, just return success without auth check
        return JsonResponse({
            'status': 'success',
            'message': 'Course data received successfully',
            'course_id': course_id,
            'title': title,
            'topics_count': len(topics_data)
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)
