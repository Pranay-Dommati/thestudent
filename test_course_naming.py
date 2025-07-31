#!/usr/bin/env python3
"""
Test course naming with first topic
"""

import requests
import json

# Test data with descriptive first topic
test_course_data = {
    "course_id": "course-naming-test",
    "title": "Machine Learning Fundamentals",  # This should be used as-is
    "topics": {
        "Neural Networks": {
            "content": {
                "reading": "Neural networks are computing systems inspired by biological neural networks. They consist of layers of interconnected nodes that process information.",
                "summary": "Neural networks use interconnected nodes to process data and learn patterns.",
                "videos": [{"title": "NN Intro", "url": "https://example.com/nn1"}],
                "quiz": [{"question": "What are neural networks?", "options": ["AI", "Networks", "Both", "None"], "correct": 2}],
                "resources": [{"title": "NN Guide", "url": "https://example.com/nn-guide"}]
            }
        },
        "Deep Learning": {
            "content": {
                "reading": "Deep learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns.",
                "summary": "Deep learning uses multi-layer neural networks for complex pattern recognition.",
                "videos": [{"title": "Deep Learning Basics", "url": "https://example.com/dl1"}],
                "quiz": [{"question": "What is deep learning?", "options": ["ML subset", "AI type", "Network", "Algorithm"], "correct": 0}],
                "resources": [{"title": "DL Papers", "url": "https://example.com/dl-papers"}]
            }
        }
    }
}

# Test data with auto-generated title (should use first topic)
auto_generated_course_data = {
    "course_id": "quantum-physics-auto",
    "title": "AI Generated Course - quantum-physics-auto",  # This should be replaced with first topic
    "topics": {
        "Quantum Mechanics": {
            "content": {
                "reading": "Quantum mechanics is the branch of physics that studies matter and energy at the smallest scales, where classical physics breaks down.",
                "summary": "Quantum mechanics describes the behavior of matter and energy at atomic and subatomic levels.",
                "videos": [{"title": "Quantum Intro", "url": "https://example.com/qm1"}],
                "quiz": [{"question": "What is quantum mechanics?", "options": ["Physics branch", "Chemistry", "Biology", "Math"], "correct": 0}],
                "resources": [{"title": "QM Textbook", "url": "https://example.com/qm-book"}]
            }
        },
        "Wave Functions": {
            "content": {
                "reading": "Wave functions are mathematical descriptions of the quantum state of a particle or system of particles.",
                "summary": "Wave functions mathematically describe quantum states of particles.",
                "videos": [{"title": "Wave Function Explained", "url": "https://example.com/wf1"}],
                "quiz": [{"question": "What do wave functions describe?", "options": ["Quantum states", "Classical motion", "Energy", "Mass"], "correct": 0}],
                "resources": [{"title": "Wave Function Math", "url": "https://example.com/wf-math"}]
            }
        }
    }
}

def test_course_naming():
    """Test both naming scenarios"""
    url = "http://localhost:8000/api/courses/pro-learning-direct/save/"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }
    
    print("🧪 Testing Course Naming...")
    
    # Test 1: Custom title (should keep as-is)
    print("\n📝 Test 1: Custom Title (should keep 'Machine Learning Fundamentals')")
    try:
        response = requests.post(url, headers=headers, json=test_course_data, timeout=30)
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ Course saved with name: '{result['course']['course_name']}'")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Auto-generated title (should use first topic)
    print("\n📝 Test 2: Auto-Generated Title (should become 'Quantum Mechanics Course')")
    try:
        response = requests.post(url, headers=headers, json=auto_generated_course_data, timeout=30)
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ Course saved with name: '{result['course']['course_name']}'")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_course_naming()
