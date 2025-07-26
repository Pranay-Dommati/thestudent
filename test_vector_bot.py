import requests
import json

# Test the vector bot API
def test_vector_bot():
    url = 'http://localhost:8000/api/chatbot/chat/general/'
    
    test_messages = [
        "What are quadratic equations?",
        "Explain photosynthesis",
        "How do I study effectively?",
        "What is Newton's law?",
        "Tell me about programming",
        "Hello"
    ]
    
    print("Testing Vector Bot API:")
    print("=" * 50)
    
    for message in test_messages:
        try:
            response = requests.post(url, 
                json={'message': message},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Query: {message}")
                print(f"   Response: {data['response'][:100]}...")
                print(f"   Source: {data.get('source', 'unknown')}")
                print()
            else:
                print(f"❌ Query: {message}")
                print(f"   Error: {response.status_code} - {response.text}")
                print()
                
        except Exception as e:
            print(f"❌ Query: {message}")
            print(f"   Exception: {str(e)}")
            print()

if __name__ == "__main__":
    test_vector_bot()
