#!/usr/bin/env python3
"""
Test script to verify the reading content classification is working
"""
import requests
import json

# Test cases for different categories
test_topics = [
    ("Photosynthesis", "academic"),  # Should be academic
    ("React Hooks", "technical"),    # Should be technical  
    ("Time Management", "skills"),   # Should be skills
    ("Stock Trading", "business_finance"),  # Should be business_finance
    ("Photography", "creative"),     # Should be creative
    ("Startup Funding", "entrepreneurship"),  # Should be entrepreneurship
    ("Ancient Philosophy", "general")  # Should be general/fallback
]

def test_reading_endpoint():
    """Test the reading endpoint with different topics"""
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/ai/reading/"
    
    print("🔍 Testing Reading Content Classification")
    print("=" * 50)
    
    for topic, expected_category in test_topics:
        try:
            print(f"\n📝 Testing: '{topic}' (expected: {expected_category})")
            
            response = requests.post(endpoint, 
                                   json={"topic": topic},
                                   headers={"Content-Type": "application/json"},
                                   timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                actual_category = result.get('topic_category', 'NOT_FOUND')
                
                status = "✅" if actual_category == expected_category else "❌"
                print(f"{status} Classified as: '{actual_category}'")
                
                if 'topic_analyzed' in result:
                    print(f"   📊 Topic analyzed: {result['topic_analyzed']}")
                
                # Check if content was generated
                if 'candidates' in result and len(result['candidates']) > 0:
                    content_length = len(result['candidates'][0].get('content', {}).get('parts', [{}])[0].get('text', ''))
                    print(f"   📄 Content generated: {content_length} characters")
                else:
                    print(f"   ⚠️ No content generated")
                    
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection failed - Is the Django server running?")
            print("   Run: python manage.py runserver")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("💡 If you see 'NOT_FOUND' categories, restart Django server to pick up changes")

if __name__ == "__main__":
    test_reading_endpoint()
