from django.shortcuts import render
import json
import os
import sys
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication

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

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def chat_general(request):
    """
    Handle general educational chat using Gemini 1.5 Flash
    This provides fast, intelligent responses for normal conversations
    """
    try:
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        message = data.get('message', '').strip()
        
        if not message:
            return Response({
                'response': "Hi! I'm here to help you learn. What subject or topic would you like to explore today?",
                'source': 'gemini_flash',
                'status': 'success'
            }, status=status.HTTP_200_OK)
        
        # Create a conversational prompt for educational assistance
        prompt = f"""You are a helpful, friendly AI educational assistant. You should:

1. Be conversational and engaging while maintaining educational value
2. Provide clear, concise explanations appropriate for students
3. Ask follow-up questions to encourage learning
4. Offer practical examples and real-world applications
5. Be supportive and encouraging
6. If the question is not educational, gently redirect to learning topics
7. Format your response using proper Markdown syntax for better readability:
   - Use **bold** for important terms and key concepts
   - Use *italics* for emphasis and definitions
   - Use `inline code` for technical terms, formulas, variable names, and short code snippets
   - Use code blocks (```) ONLY for multi-line code examples, NOT for simple text or single values
   - Use bullet points (-) for listing features, benefits, or key points - do NOT put simple list items in code blocks
   - Use numbered lists (1., 2., 3.) for step-by-step explanations or procedures
   - Use ## headings for main sections when explaining complex topics
   - Use ### subheadings for subsections
   - Use > blockquotes for important notes, tips, or warnings
   - Ensure proper spacing between sections for readability
   - IMPORTANT: Avoid putting simple text, numbers, or single words in code blocks unless they are actual code

Student's question: {message}

Please provide a helpful, educational response formatted in clean, well-structured Markdown:"""

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
                    return Response({
                        'response': response_text,
                        'source': 'gemini_flash',
                        'status': 'success'
                    }, status=status.HTTP_200_OK)
            
            # Fallback if response format is unexpected
            raise Exception("Unexpected response format from Gemini")
            
        except Exception as gemini_error:
            print(f"❌ Gemini Flash API failed: {gemini_error}")
            # Fallback to vector bot if Gemini fails
            print("🔄 Falling back to vector bot...")
            educational_bot = initialize_bot()
            response = educational_bot.get_best_response(message)
            
            return Response({
                'response': response,
                'source': 'vector_bot_fallback',
                'status': 'success'
            }, status=status.HTTP_200_OK)
        
    except json.JSONDecodeError:
        return Response({
            'response': "I'm having trouble understanding your message. Could you please try again?",
            'source': 'gemini_flash',
            'status': 'error'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        print(f"Error in chat_general endpoint: {e}")
        return Response({
            'response': "I'm here to support your learning, but I'm having some technical difficulties. Please try asking about a specific subject like math, science, history, or study tips.",
            'source': 'gemini_flash',
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def analyze_subject(request):
    """
    Analyze what subject area the user is asking about
    """
    try:
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        message = data.get('message', '')
        
        educational_bot = initialize_bot()
        subject = educational_bot.analyze_subject_area(message)
        
        return Response({
            'subject': subject,
            'status': 'success'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'subject': 'general',
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    try:
        educational_bot = initialize_bot()
        return Response({
            'status': 'healthy',
            'bot_initialized': bot is not None,
            'questions_loaded': len(educational_bot.questions) if educational_bot else 0
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Create your views here.
