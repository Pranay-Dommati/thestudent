"""
Django server startup and API endpoint test
"""
import os
import sys
import subprocess
import time
import requests
import json
import threading

def start_django_server():
    """Start Django development server"""
    backend_dir = r"c:\Users\banny\OneDrive\Documents\Desktop\STUDENTSHUB\SHPRO\thestudent\backend"
    
    print("Starting Django server...")
    os.chdir(backend_dir)
    
    # Start server in background
    process = subprocess.Popen([
        sys.executable, "manage.py", "runserver", "localhost:8000"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    return process

def test_api_endpoint():
    """Test the Pro Learning save endpoint"""
    url = "http://localhost:8000/api/courses/pro-learning/save-from-storage/"
    
    # Test data matching frontend format
    test_data = {
        "course_id": "test-course-12345",
        "title": "Test AI Course",
        "topics": {
            "Introduction to AI": {
                "videos": [
                    {"title": "What is AI?", "url": "https://example.com/video1"}
                ],
                "quizQuestions": [
                    {
                        "question": "What does AI stand for?",
                        "options": ["Artificial Intelligence", "Automated Intelligence"],
                        "correct": 0
                    }
                ],
                "resources": [
                    {"title": "AI Basics", "url": "https://example.com/resource1"}
                ]
            }
        }
    }
    
    headers = {
        'Content-Type': 'application/json',
        # Note: This will test without auth first to see if endpoint accepts POST
    }
    
    print(f"\nTesting endpoint: {url}")
    
    try:
        response = requests.post(url, json=test_data, headers=headers, timeout=10)
        print(f"Response Status: {response.status_code}")
        print(f"Response Content: {response.text[:500]}")
        
        if response.status_code == 401:
            print("✅ Endpoint accepts POST requests (auth required as expected)")
        elif response.status_code == 405:
            print("❌ Method Not Allowed - URL/view configuration issue")
        elif response.status_code == 404:
            print("❌ Endpoint not found - URL pattern issue")
        else:
            print(f"ℹ️ Unexpected status: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server")
    except Exception as e:
        print(f"❌ Test error: {e}")

def main():
    print("=== Django Pro Learning API Test ===")
    
    # Start Django server
    server_process = start_django_server()
    
    try:
        # Wait for server to start
        print("Waiting for server to start...")
        time.sleep(5)
        
        # Test the endpoint
        test_api_endpoint()
        
    finally:
        # Clean up
        print("\nStopping Django server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main()
