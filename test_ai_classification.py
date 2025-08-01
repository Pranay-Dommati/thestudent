#!/usr/bin/env python3
"""
Test the AI-powered topic classification
"""
import requests
import json

def test_ai_classification():
    """Test a few topics to see AI classification in action"""
    test_topics = [
        "Photosynthesis",
        "React Hooks", 
        "Time Management",
        "Stock Trading"
    ]
    
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/ai/reading/"
    
    print("🤖 Testing AI-Powered Topic Classification")
    print("=" * 50)
    
    for topic in test_topics:
        try:
            print(f"\n📝 Testing: '{topic}'")
            
            response = requests.post(endpoint, 
                                   json={"topic": topic},
                                   headers={"Content-Type": "application/json"},
                                   timeout=30)  # Increased timeout for AI calls
            
            if response.status_code == 200:
                result = response.json()
                category = result.get('topic_category', 'NOT_FOUND')
                
                print(f"✅ AI classified as: '{category}'")
                
                if 'topic_analyzed' in result:
                    print(f"   📊 Topic analyzed: {result['topic_analyzed']}")
                    
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            print("⏰ Request timed out - AI classification may be slow")
        except requests.exceptions.ConnectionError:
            print("❌ Connection failed - Is the Django server running?")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("💡 The AI should now provide much more accurate topic classification!")

if __name__ == "__main__":
    test_ai_classification()
