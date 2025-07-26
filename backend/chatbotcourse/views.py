from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import os
from .educational_vector_bot import EducationalVectorBot

# Initialize the educational bot
bot = None

def initialize_bot():
    global bot
    if bot is None:
        vector_store_path = os.path.join(os.path.dirname(__file__), 'vector_store.index')
        bot = EducationalVectorBot(vector_store_path)
    return bot

@csrf_exempt
@require_http_methods(["POST"])
def chat_general(request):
    """
    Handle general educational chat without using Gemini API
    This is for non-pro users who want basic educational assistance
    """
    try:
        data = json.loads(request.body)
        message = data.get('message', '').strip()
        
        if not message:
            return JsonResponse({
                'response': "Hi! I'm here to help you learn. What subject or topic would you like to explore today?",
                'source': 'vector_bot',
                'status': 'success'
            })
        
        # Initialize bot if not already done
        educational_bot = initialize_bot()
        
        # Get AI response using vector similarity
        response = educational_bot.get_best_response(message)
        
        return JsonResponse({
            'response': response,
            'source': 'vector_bot',
            'status': 'success'
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'response': "I'm having trouble understanding your message. Could you please try again?",
            'source': 'vector_bot',
            'status': 'error'
        }, status=400)
    
    except Exception as e:
        print(f"Error in chat_general endpoint: {e}")
        return JsonResponse({
            'response': "I'm here to support your learning, but I'm having some technical difficulties. Please try asking about a specific subject like math, science, history, or study tips.",
            'source': 'vector_bot',
            'status': 'error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def analyze_subject(request):
    """
    Analyze what subject area the user is asking about
    """
    try:
        data = json.loads(request.body)
        message = data.get('message', '')
        
        educational_bot = initialize_bot()
        subject = educational_bot.analyze_subject_area(message)
        
        return JsonResponse({
            'subject': subject,
            'status': 'success'
        })
    
    except Exception as e:
        return JsonResponse({
            'subject': 'general',
            'status': 'error',
            'error': str(e)
        }, status=500)

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint"""
    try:
        educational_bot = initialize_bot()
        return JsonResponse({
            'status': 'healthy',
            'bot_initialized': bot is not None,
            'questions_loaded': len(educational_bot.questions) if educational_bot else 0
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'error': str(e)
        }, status=500)

# Create your views here.
