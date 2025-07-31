#!/usr/bin/env python3
"""
Debug script to test Pro Learning course creation
"""

import requests
import json

# Test data with proper structure
test_course_data = {
    "course_id": "jfet-debug-test",
    "title": "JFET Debug Course",
    "topics": {
        "JFET Basics": {
            "readingMaterial": "This is comprehensive reading material about JFET basics. It covers the fundamentals of Junction Field Effect Transistors, their construction, working principles, and applications in electronic circuits.",
            "summary": "JFET is a voltage-controlled device that uses the electric field to control current flow. Key points: unipolar device, high input impedance, voltage-controlled.",
            "videos": [
                {
                    "title": "JFET Introduction",
                    "url": "https://www.youtube.com/watch?v=example1"
                },
                {
                    "title": "JFET Working Principle", 
                    "url": "https://www.youtube.com/watch?v=example2"
                }
            ],
            "quiz": [
                {
                    "question": "What type of device is JFET?",
                    "options": ["Bipolar", "Unipolar", "Both", "Neither"],
                    "correct": 1
                },
                {
                    "question": "JFET is controlled by?",
                    "options": ["Current", "Voltage", "Power", "Resistance"],
                    "correct": 1
                }
            ],
            "resources": [
                {
                    "title": "JFET Datasheet",
                    "url": "https://example.com/jfet-datasheet.pdf"
                },
                {
                    "title": "JFET Applications Guide",
                    "url": "https://example.com/jfet-applications.pdf"
                }
            ]
        },
        "JFET Characteristics": {
            "readingMaterial": "This section covers the various characteristics of JFET including drain characteristics, transfer characteristics, and parameters like transconductance, drain resistance, and amplification factor.",
            "summary": "JFET characteristics include drain characteristics (Id vs Vds) and transfer characteristics (Id vs Vgs). Important parameters: gm, rd, μ.",
            "videos": [
                {
                    "title": "JFET Characteristics Explained",
                    "url": "https://www.youtube.com/watch?v=example3"
                }
            ],
            "quiz": [
                {
                    "question": "What is transconductance?",
                    "options": ["Ratio of Id to Vds", "Ratio of Id to Vgs", "Ratio of Vds to Id", "Ratio of Vgs to Id"],
                    "correct": 1
                }
            ],
            "resources": [
                {
                    "title": "JFET Parameters Guide",
                    "url": "https://example.com/jfet-parameters.pdf"
                }
            ]
        }
    }
}

def test_course_creation():
    """Test the course creation API"""
    url = "http://localhost:8000/api/courses/pro-learning-direct/save/"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }
    
    print("🧪 Testing Pro Learning Course Creation...")
    print(f"📊 Course: {test_course_data['title']}")
    print(f"📚 Topics: {len(test_course_data['topics'])}")
    
    for topic_name, topic_content in test_course_data['topics'].items():
        print(f"\n📖 Topic: {topic_name}")
        print(f"   📄 Reading Material: {len(topic_content.get('readingMaterial', ''))} chars")
        print(f"   📝 Summary: {len(topic_content.get('summary', ''))} chars")
        print(f"   🎥 Videos: {len(topic_content.get('videos', []))}")
        print(f"   ❓ Quiz: {len(topic_content.get('quiz', []))}")
        print(f"   📎 Resources: {len(topic_content.get('resources', []))}")
    
    try:
        response = requests.post(url, headers=headers, json=test_course_data, timeout=30)
        
        print(f"\n🔍 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
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
    test_course_creation()
