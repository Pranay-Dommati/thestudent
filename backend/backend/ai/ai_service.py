import requests
import json
import time
import random
from django.conf import settings
from requests.exceptions import ConnectionError, Timeout, RequestException
import socket

class NetworkError(Exception):
    """Custom exception for network-related errors"""
    pass

def call_gemini_api(prompt, max_retries=5):
    """Call Gemini API with enhanced retry logic and exponential backoff for Pro model"""
    GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
    
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    for attempt in range(max_retries):
        try:
            print(f"🔑 Calling Gemini 1.5 Pro API (attempt {attempt + 1}/{max_retries})")
            
            headers = {'Content-Type': 'application/json'}
            data = {
                'contents': [{
                    'role': 'user',
                    'parts': [{'text': prompt}]
                }],
                'generationConfig': {
                    'temperature': 0.3,
                    'topK': 20,
                    'topP': 0.8,
                    'maxOutputTokens': 4096,
                    'stopSequences': []
                }
            }
            
            response = requests.post(
                f'{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}', 
                headers=headers, 
                data=json.dumps(data),
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Gemini 1.5 Pro API call successful")
                return response.json()
            elif response.status_code in [429, 503]:
                # Calculate exponential backoff with jitter for overload/rate limit
                base_delay = 2 ** attempt  # 2, 4, 8, 16, 32 seconds
                jitter = random.uniform(0.5, 1.5)  # Add randomness to avoid thundering herd
                delay = min(base_delay * jitter, 60)  # Cap at 60 seconds
                
                error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                print(f"⏰ {error_type} ({response.status_code}), retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:  # Don't sleep on the last attempt
                    time.sleep(delay)
                continue
            else:
                print(f"❌ Gemini API error {response.status_code}: {response.text}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Short delay for other errors
                continue
                
        except (ConnectionError, Timeout, socket.gaierror) as e:
            print(f"🌐 Network connection error: {str(e)}")
            # Don't retry network errors automatically - let frontend handle it
            raise NetworkError("Network connection lost. Please check your internet connection and try again.")
        except Exception as e:
            print(f"❌ Error with Gemini API: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(2)
            continue
    
    raise Exception("All Gemini API attempts failed") 

def call_gemini_flash_api(prompt, max_retries=3):
    """Call Gemini 1.5 Flash API for fast conversations - optimized for chat"""
    GEMINI_FLASH_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    
    if not settings.GEMINI_API_KEY:
        raise Exception("Gemini API key not configured")
    
    network_error_count = 0
    
    for attempt in range(max_retries):
        try:
            print(f"⚡ Calling Gemini 1.5 Flash API (attempt {attempt + 1}/{max_retries})")
            
            headers = {'Content-Type': 'application/json'}
            data = {
                'contents': [{
                    'role': 'user',
                    'parts': [{'text': prompt}]
                }],
                'generationConfig': {
                    'temperature': 0.7,  # Slightly higher for more conversational responses
                    'topK': 40,
                    'topP': 0.9,
                    'maxOutputTokens': 2048,  # Lower for faster responses
                    'stopSequences': []
                }
            }
            
            response = requests.post(
                f'{GEMINI_FLASH_API_URL}?key={settings.GEMINI_API_KEY}', 
                headers=headers, 
                data=json.dumps(data),
                timeout=15  # Shorter timeout for flash model
            )
            
            if response.status_code == 200:
                print("✅ Gemini 1.5 Flash API call successful")
                return response.json()
            elif response.status_code in [429, 503]:
                # Shorter backoff for flash model
                base_delay = 1.5 ** attempt  # 1.5, 2.25, 3.375 seconds
                jitter = random.uniform(0.8, 1.2)
                delay = min(base_delay * jitter, 10)  # Cap at 10 seconds
                
                error_type = "Rate limit" if response.status_code == 429 else "Service overloaded"
                print(f"⏰ {error_type} ({response.status_code}), retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:
                    time.sleep(delay)
                continue
            else:
                print(f"❌ Gemini Flash API error {response.status_code}: {response.text}")
                if attempt < max_retries - 1:
                    time.sleep(1)  # Shorter delay for flash model
                continue
                
        except (ConnectionError, Timeout, socket.gaierror) as e:
            print(f"🌐 Network connection error: {str(e)}")
            # Don't retry network errors automatically - let frontend handle it
            raise NetworkError("Network connection lost. Please check your internet connection and try again.")
        except Exception as e:
            print(f"❌ Error with Gemini Flash API: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1)
            continue
    
    raise Exception("All Gemini Flash API attempts failed") 