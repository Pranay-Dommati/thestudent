"""
Simple Django view to test basic POST functionality
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["POST"])
def simple_test_view(request):
    """Simple test view that accepts POST requests"""
    try:
        data = json.loads(request.body)
        return JsonResponse({
            'status': 'success',
            'message': 'POST request received successfully',
            'received_data': data
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=400)
