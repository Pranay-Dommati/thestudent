#!/usr/bin/env python3
"""
Test script to simulate the exact frontend workflow for learning plans
"""
import requests
import json
import uuid

def create_test_learning_plan():
    """Create a learning plan that matches the frontend structure"""
    api_url = "http://127.0.0.1:8000/api/learning/generate-learning-plan/"
    
    # Create a learning plan with the exact structure the frontend generates
    test_data = {
        "goal": "Learn ReactJS in 7 days",
        "days": [
            {
                "day": 1,
                "topic": "React Fundamentals",
                "project_idea": "Create your first React component",
                "youtube_query": "React fundamentals tutorial",
                "videos": [
                    {
                        "title": "React JS Tutorial for Beginners",
                        "description": "Complete React tutorial covering components, JSX, and props",
                        "video_id": "Ke90Tje7VS0",
                        "thumbnail_url": "https://i.ytimg.com/vi/Ke90Tje7VS0/hqdefault.jpg",
                        "channel_title": "Programming with Mosh"
                    }
                ]
            },
            {
                "day": 2,
                "topic": "Components and JSX",
                "project_idea": "Build a simple todo list component",
                "youtube_query": "React components JSX tutorial",
                "videos": [
                    {
                        "title": "React Components and JSX Explained",
                        "description": "Learn how to create and use React components with JSX",
                        "video_id": "7o5FPaVA9m0",
                        "thumbnail_url": "https://i.ytimg.com/vi/7o5FPaVA9m0/hqdefault.jpg",
                        "channel_title": "Codevolution"
                    }
                ]
            },
            {
                "day": 3,
                "topic": "State and Props",
                "project_idea": "Interactive counter application",
                "youtube_query": "React state props tutorial",
                "videos": [
                    {
                        "title": "React State and Props Tutorial",
                        "description": "Understanding state management and passing props in React",
                        "video_id": "IYvD9oBCuJI",
                        "thumbnail_url": "https://i.ytimg.com/vi/IYvD9oBCuJI/hqdefault.jpg",
                        "channel_title": "Dev Ed"
                    }
                ]
            }
        ]
    }
    
    try:
        print("🚀 Creating React learning plan...")
        response = requests.post(api_url, json=test_data, headers={'Content-Type': 'application/json'})
        
        if response.status_code == 201:
            plan_data = response.json()
            plan_id = plan_data.get('id')
            print(f"✅ Learning plan created with ID: {plan_id}")
            print(f"📚 Title: {plan_data.get('title')}")
            print(f"📅 Days: {len(plan_data.get('days', []))}")
            
            # Generate the learning interface URL
            learning_url = f"http://localhost:5173/learning/{plan_id}"
            print(f"\n🔗 Access the learning plan at: {learning_url}")
            
            # Print the day structure for verification
            print("\n📖 Learning plan structure:")
            for day in plan_data.get('days', []):
                videos = day.get('videos', [])
                print(f"  Day {day.get('day')}: {day.get('topic')}")
                for video in videos:
                    print(f"    📺 {video.get('title')} (ID: {video.get('video_id')})")
            
            return plan_id
        else:
            print(f"❌ Failed to create learning plan: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_plan_access(plan_id):
    """Test accessing the learning plan via the API"""
    if not plan_id:
        return
        
    get_url = f"http://127.0.0.1:8000/api/learning/plans/{plan_id}/"
    
    try:
        print(f"\n🔍 Testing plan access...")
        response = requests.get(get_url)
        
        if response.status_code == 200:
            plan_data = response.json()
            print(f"✅ Plan accessible via API")
            print(f"📋 Data structure valid: {len(plan_data.get('days', []))} days with videos")
            
            # Verify YouTube URLs would work
            for day in plan_data.get('days', []):
                for video in day.get('videos', []):
                    video_id = video.get('video_id')
                    if video_id:
                        youtube_url = f"https://www.youtube.com/embed/{video_id}"
                        print(f"    🎥 YouTube embed URL: {youtube_url}")
        else:
            print(f"❌ Cannot access plan: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing plan access: {e}")

if __name__ == "__main__":
    print("🧪 Testing Learning Plan Integration\n")
    plan_id = create_test_learning_plan()
    test_plan_access(plan_id)
    
    if plan_id:
        print(f"\n🎯 Next steps:")
        print(f"1. Go to http://localhost:5173/chatbot")
        print(f"2. Ask: 'Learn ReactJS in 7 days'")
        print(f"3. Click the learning plan link")
        print(f"4. Or directly visit: http://localhost:5173/learning/{plan_id}")
        print(f"\n✨ The learning plan should now display properly with YouTube videos!")
