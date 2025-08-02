from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import os
import sys

# Add the backend path to access ai_service
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from backend.ai.ai_service import call_gemini_flash_api

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
    Handle general educational chat using Gemini 1.5 Flash
    This provides fast, intelligent responses for normal conversations
    """
    try:
        data = json.loads(request.body)
        message = data.get('message', '').strip()
        
        if not message:
            return JsonResponse({
                'response': "Hi! I'm here to help you learn. What subject or topic would you like to explore today?",
                'source': 'gemini_flash',
                'status': 'success'
            })
        
        # Create a conversational prompt for educational assistance
        prompt = f"""You are a helpful, friendly AI educational assistant. You should:

1. Be conversational and engaging while maintaining educational value
2. Provide clear, concise explanations appropriate for students
3. Ask follow-up questions to encourage learning
4. Offer practical examples and real-world applications
5. Be supportive and encouraging
6. If the question is not educational, gently redirect to learning topics
7. Format your response using proper Markdown syntax for better readability:
   - Use **bold** for important terms and concepts
   - Use *italics* for emphasis
   - Use `code blocks` for technical terms, formulas, or code
   - Use numbered lists (1., 2., 3.) for step-by-step explanations
   - Use bullet points (-) for key points or features
   - Use ## headings for main sections when explaining complex topics
   - Use > blockquotes for important notes or tips

Student's question: {message}

Please provide a helpful, educational response formatted in Markdown:"""

        # Call Gemini 1.5 Flash API
        try:
            print(f"🎓 Processing chat message with Gemini Flash: {message[:50]}...")
            response_data = call_gemini_flash_api(prompt)
            
            # Extract the response text from Gemini's response format
            if 'candidates' in response_data and len(response_data['candidates']) > 0:
                candidate = response_data['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    response_text = candidate['content']['parts'][0]['text']
                    
                    print("✅ Generated response with Gemini 1.5 Flash")
                    return JsonResponse({
                        'response': response_text,
                        'source': 'gemini_flash',
                        'status': 'success'
                    })
            
            # Fallback if response format is unexpected
            raise Exception("Unexpected response format from Gemini")
            
        except Exception as gemini_error:
            print(f"❌ Gemini Flash API failed: {gemini_error}")
            # Fallback to vector bot if Gemini fails
            print("🔄 Falling back to vector bot...")
            educational_bot = initialize_bot()
            response = educational_bot.get_best_response(message)
            
            return JsonResponse({
                'response': response,
                'source': 'vector_bot_fallback',
                'status': 'success'
            })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'response': "I'm having trouble understanding your message. Could you please try again?",
            'source': 'gemini_flash',
            'status': 'error'
        }, status=400)
    
    except Exception as e:
        print(f"Error in chat_general endpoint: {e}")
        return JsonResponse({
            'response': "I'm here to support your learning, but I'm having some technical difficulties. Please try asking about a specific subject like math, science, history, or study tips.",
            'source': 'gemini_flash',
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
