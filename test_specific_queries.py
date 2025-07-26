import requests
import json

# Test the vector bot API with specific problematic queries
def test_specific_queries():
    url = 'http://localhost:8000/api/chatbot/chat/general/'
    
    test_messages = [
        "i want to learn html",
        "i want to learn english", 
        "grammar",
        "how are you",
        "tell me about HTML",
        "CSS basics",
        "what is javascript",
        "help with grammar rules",
        "parts of speech",
        "web development"
    ]
    
    print("Testing Specific Problematic Queries:")
    print("=" * 60)
    
    for message in test_messages:
        try:
            response = requests.post(url, 
                json={'message': message},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"Query: '{message}'")
                print(f"Response: {data['response'][:200]}...")
                print("-" * 40)
            else:
                print(f"❌ Query: {message}")
                print(f"   Error: {response.status_code} - {response.text}")
                print()
                
        except Exception as e:
            print(f"❌ Query: {message}")
            print(f"   Exception: {str(e)}")
            print()

if __name__ == "__main__":
    test_specific_queries()
