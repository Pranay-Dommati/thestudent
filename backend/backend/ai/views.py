from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .quiz import handle_quiz
from .summary import handle_summary
from .reading import handle_reading
from .resources import handle_resources
from .videos import handle_videos
from .topics import handle_topics

@csrf_exempt
def quiz(request):
    return handle_quiz(request)

@csrf_exempt
def summary(request):
    return handle_summary(request)

@csrf_exempt
def reading(request):
    return handle_reading(request)

@csrf_exempt
def resources(request):
    return handle_resources(request)

@csrf_exempt
def videos(request):
    return handle_videos(request)

@csrf_exempt
def topics(request):
    return handle_topics(request) 