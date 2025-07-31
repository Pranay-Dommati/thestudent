#!/usr/bin/env python3
"""
Test with frontend-like data structure
"""

import requests
import json

# Test data matching frontend structure
frontend_course_data = {
    "course_id": "frontend-structure-test",
    "title": "Frontend Structure Test Course",
    "topics": {
        "React Basics": {
            "name": "React Basics",
            "content": {
                "reading": "This is the reading material for React Basics from the frontend. It contains comprehensive information about React fundamentals, components, JSX, and state management.",
                "summary": "React is a JavaScript library for building user interfaces. Key concepts: components, JSX, props, state.",
                "videos": [
                    {
                        "title": "React Introduction Tutorial",
                        "url": "https://www.youtube.com/watch?v=react1"
                    },
                    {
                        "title": "React Components Deep Dive",
                        "url": "https://www.youtube.com/watch?v=react2"
                    }
                ],
                "quiz": [
                    {
                        "question": "What is React?",
                        "options": ["Framework", "Library", "Language", "Database"],
                        "correct": 1
                    },
                    {
                        "question": "What is JSX?",
                        "options": ["JavaScript Extension", "Java Syntax", "JSON XML", "JavaScript XML"],
                        "correct": 3
                    }
                ],
                "resources": [
                    {
                        "title": "React Official Documentation",
                        "url": "https://react.dev/docs"
                    },
                    {
                        "title": "React Tutorial for Beginners",
                        "url": "https://example.com/react-tutorial"
                    }
                ]
            }
        },
        "React Hooks": {
            "name": "React Hooks",
            "content": {
                "reading": "React Hooks are functions that let you use state and other React features in functional components. This section covers useState, useEffect, useContext, and custom hooks.",
                "summary": "Hooks enable functional components to use state and lifecycle methods. Common hooks: useState, useEffect, useContext.",
                "videos": [
                    {
                        "title": "React Hooks Explained",
                        "url": "https://www.youtube.com/watch?v=hooks1"
                    }
                ],
                "quiz": [
                    {
                        "question": "Which hook is used for state management?",
                        "options": ["useEffect", "useState", "useContext", "useReducer"],
                        "correct": 1
                    }
                ],
                "resources": [
                    {
                        "title": "Hooks API Reference",
                        "url": "https://react.dev/reference/react"
                    }
                ]
            }
        }
    }
}

def test_frontend_structure():
    """Test with frontend data structure"""
    url = "http://localhost:8000/api/courses/pro-learning-direct/save/"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }
    
    print("🧪 Testing Frontend Data Structure...")
    print(f"📊 Course: {frontend_course_data['title']}")
    print(f"📚 Topics: {len(frontend_course_data['topics'])}")
    
    for topic_name, topic_data in frontend_course_data['topics'].items():
        content = topic_data.get('content', {})
        print(f"\n📖 Topic: {topic_name}")
        print(f"   📄 Reading: {len(content.get('reading', ''))} chars")
        print(f"   📝 Summary: {len(content.get('summary', ''))} chars")
        print(f"   🎥 Videos: {len(content.get('videos', []))}")
        print(f"   ❓ Quiz: {len(content.get('quiz', []))}")
        print(f"   📎 Resources: {len(content.get('resources', []))}")
    
    try:
        response = requests.post(url, headers=headers, json=frontend_course_data, timeout=30)
        
        print(f"\n🔍 Response Status: {response.status_code}")
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"📊 Response: {json.dumps(result, indent=2)}")
        else:
            print("❌ FAILED!")
            print(f"📋 Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

if __name__ == "__main__":
    test_frontend_structure()
