#!/usr/bin/env python3
"""
Test just the classification logic without making API calls
"""
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import the classification function
from backend.ai.reading import classify_topic

def test_classification():
    """Test our topic classification logic"""
    
    test_cases = [
        ('Photosynthesis', 'academic'),
        ('React Hooks', 'technical'),
        ('Time Management', 'skills'),
        ('Stock Trading', 'business_finance'),
        ('Photography', 'creative'),
        ('Startup Funding', 'entrepreneurship'),
        ('Ancient Philosophy', 'general'),
        ('Python Programming', 'technical'),
        ('World War 2', 'academic'),
        ('Public Speaking', 'skills'),
        ('Investment Strategy', 'business_finance'),
        ('Digital Art', 'creative'),
        ('Business Model', 'entrepreneurship'),
        ('Quantum Physics', 'academic'),
        ('Machine Learning', 'technical'),
        ('Leadership', 'skills'),
        ('Random Topic XYZ', 'general')
    ]
    
    print("🔍 Testing Topic Classification Logic")
    print("=" * 50)
    
    correct = 0
    total = len(test_cases)
    
    for topic, expected in test_cases:
        try:
            result = classify_topic(topic)
            status = "✅" if result == expected else "❌"
            print(f"{status} '{topic}' → {result} (expected: {expected})")
            
            if result == expected:
                correct += 1
        except Exception as e:
            print(f"❌ Error classifying '{topic}': {e}")
    
    print(f"\n📊 Results: {correct}/{total} correct ({correct/total*100:.1f}%)")
    
    if correct == total:
        print("🎉 All classifications are working correctly!")
    else:
        print("⚠️  Some classifications need adjustment")

if __name__ == "__main__":
    test_classification()
