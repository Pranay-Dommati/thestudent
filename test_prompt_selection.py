#!/usr/bin/env python3
"""
AI Prompt Selection Verification Script
Tests specific topics to verify correct prompt selection
"""

import requests
import json

def test_prompt_selection(topic, expected_category=None):
    """Test a specific topic and show the classification results"""
    
    print(f"\n{'='*80}")
    print(f"🧪 TESTING TOPIC: '{topic}'")
    print(f"{'='*80}")
    
    if expected_category:
        print(f"📋 Expected Category: {expected_category.upper()}")
    
    # Make request to the reading API
    url = "http://localhost:8000/ai/reading/"  # Adjust URL if needed
    payload = {"topic": topic}
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ REQUEST SUCCESSFUL")
            print(f"📊 ACTUAL RESULTS:")
            print(f"   • Classified as: {result.get('topic_category', 'unknown').upper()}")
            print(f"   • Method: {result.get('classification_method', 'unknown')}")
            print(f"   • Content length: {len(str(result.get('content', '')))}")
            
            # Check if classification matches expectation
            if expected_category:
                actual_category = result.get('topic_category', '').lower()
                if actual_category == expected_category.lower():
                    print(f"   ✅ CLASSIFICATION CORRECT!")
                else:
                    print(f"   ❌ CLASSIFICATION INCORRECT! Expected: {expected_category}, Got: {actual_category}")
            
            # Show content preview
            content = str(result.get('content', ''))
            if content:
                print(f"\n📝 CONTENT PREVIEW (first 300 chars):")
                print(f"{'─'*60}")
                print(content[:300] + "..." if len(content) > 300 else content)
                print(f"{'─'*60}")
                
        else:
            print(f"❌ REQUEST FAILED: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def main():
    """Run tests for different topic categories"""
    
    print("🚀 AI Prompt Selection Verification Script")
    print("Make sure your Django server is running on localhost:8000")
    
    # Test cases with expected categories
    test_cases = [
        # Technical topics
        ("React Hooks", "technical"),
        ("Python Machine Learning", "technical"),
        ("Database Design", "technical"),
        ("JavaScript Promises", "technical"),
        
        # Academic topics  
        ("World War 2", "academic"),
        ("Quantum Physics", "academic"),
        ("Ancient Greek History", "academic"),
        ("Photosynthesis Process", "academic"),
        
        # Skills topics
        ("Public Speaking", "skills"),
        ("Time Management", "skills"),
        ("Leadership Development", "skills"),
        ("Emotional Intelligence", "skills"),
        
        # Business/Finance topics
        ("Stock Market Investing", "business_finance"),
        ("Personal Budgeting", "business_finance"),
        ("Financial Planning", "business_finance"),
        ("Cryptocurrency Trading", "business_finance"),
        
        # Creative topics
        ("Photography Techniques", "creative"),
        ("Creative Writing", "creative"),
        ("Video Editing", "creative"),
        ("Graphic Design", "creative"),
        
        # Entrepreneurship topics
        ("Startup Strategy", "entrepreneurship"),
        ("Business Plan Development", "entrepreneurship"),
        ("Digital Marketing", "entrepreneurship"),
        ("Product Launch", "entrepreneurship"),
        
        # Edge cases that might be tricky
        ("Machine Learning for Marketing", None),  # Could be technical or entrepreneurship
        ("Financial Modeling in Python", None),   # Could be technical or business_finance
        ("Creative Problem Solving", None),       # Could be creative or skills
    ]
    
    # Run all test cases
    for topic, expected in test_cases:
        test_prompt_selection(topic, expected)
        
        # Pause between tests
        input("\nPress Enter to continue to next test...")
    
    print(f"\n{'='*80}")
    print("🎉 All tests completed!")
    print("Review the console output to verify prompt selection accuracy.")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
