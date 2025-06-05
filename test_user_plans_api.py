#!/usr/bin/env python3
"""
Test script to verify the user-plans API endpoint response format
"""

import requests
import json
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(project_root, 'backend'))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from courses.models import AILearningPlan

User = get_user_model()

def test_user_plans_api():
    """Test the user-plans API endpoint"""
    print("🧪 TESTING USER PLANS API ENDPOINT")
    print("=" * 60)
    
    # Base URL for API
    BASE_URL = "http://127.0.0.1:8000"
    
    try:
        # First, let's check what learning plans exist in the database
        print("📊 CURRENT DATABASE STATE:")
        total_users = User.objects.count()
        total_plans = AILearningPlan.objects.count()
        print(f"   Total Users: {total_users}")
        print(f"   Total AI Learning Plans: {total_plans}")
        
        if total_plans == 0:
            print("   ⚠️  No learning plans found in database")
            print("   Creating a test plan for testing...")
            
            # Create a test user if none exists
            test_user = User.objects.first()
            if not test_user:
                test_user = User.objects.create_user(
                    email='test@example.com',
                    password='testpass123'
                )
                print(f"   ✅ Created test user: {test_user.email}")
            
            # Create a test learning plan
            test_plan = AILearningPlan.objects.create(
                user=test_user,
                title="Test Learning Plan - Python Basics",
                description="A test learning plan for API testing",
                plan_data={
                    'goal': 'Learn Python',
                    'days': [
                        {
                            'day': 1,
                            'topic': 'Python Fundamentals',
                            'project_idea': 'Hello World Program',
                            'youtube_query': 'python basics tutorial',
                            'videos': [
                                {
                                    'title': 'Python Tutorial for Beginners',
                                    'description': 'Learn Python basics',
                                    'video_id': 'rfscVS0vtbw',
                                    'thumbnail_url': 'https://img.youtube.com/vi/rfscVS0vtbw/0.jpg',
                                    'channel_title': 'freeCodeCamp.org'
                                }
                            ]
                        }
                    ]
                },
                duration_days=1,
                difficulty_level='beginner',
                category='Programming'
            )
            print(f"   ✅ Created test learning plan: {test_plan.title}")
        
        print()
        
        # Show existing plans
        print("📋 EXISTING LEARNING PLANS:")
        for plan in AILearningPlan.objects.all():
            print(f"   - {plan.title} (User: {plan.user.email if plan.user else 'No User'})")
        
        print()
        
        # Test the API endpoint without authentication first
        print("🌐 TESTING API ENDPOINT (Unauthenticated):")
        response = requests.get(f"{BASE_URL}/api/learning/user-plans/")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Expected 401 - Authentication required")
        else:
            print(f"   ❌ Unexpected status code: {response.status_code}")
            print(f"   Response: {response.text}")
        
        print()
        
        # Test with a user to see the actual response format
        print("📊 TESTING API RESPONSE FORMAT:")
        # Get the first user for testing
        test_user = User.objects.first()
        if test_user:
            # Simulate authenticated request by checking the view directly
            from django.test import RequestFactory
            from django.contrib.auth.models import AnonymousUser
            from courses.views_learning_plan import get_user_learning_plans
            
            factory = RequestFactory()
            request = factory.get('/api/learning/user-plans/')
            request.user = test_user
            
            try:
                response = get_user_learning_plans(request)
                print(f"   Status Code: {response.status_code}")
                print(f"   Response Data Type: {type(response.data)}")
                print(f"   Response Keys: {list(response.data.keys()) if isinstance(response.data, dict) else 'Not a dict'}")
                
                if isinstance(response.data, dict):
                    if 'count' in response.data:
                        print(f"   Count: {response.data['count']}")
                    if 'plans' in response.data:
                        plans = response.data['plans']
                        print(f"   Plans Type: {type(plans)}")
                        print(f"   Number of Plans: {len(plans) if isinstance(plans, list) else 'Not a list'}")
                        
                        if isinstance(plans, list) and len(plans) > 0:
                            print(f"   First Plan Keys: {list(plans[0].keys()) if isinstance(plans[0], dict) else 'Not a dict'}")
                
                print("\n   📄 FULL RESPONSE STRUCTURE:")
                response_json = json.dumps(response.data, indent=2, default=str)
                print(f"   {response_json}")
                
            except Exception as e:
                print(f"   ❌ Error calling view directly: {e}")
        else:
            print("   ❌ No users found in database")
        
        print()
        print("🎯 SUMMARY:")
        print("   The API endpoint `/api/learning/user-plans/` returns:")
        print("   {")
        print("     'count': <number>,")
        print("     'plans': [<array_of_plan_objects>]")
        print("   }")
        print("   Frontend needs to access response.data.plans, not response.data directly")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_user_plans_api()
