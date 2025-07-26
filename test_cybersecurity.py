import requests
import json

def test_cybersecurity():
    url = 'http://localhost:8000/api/chatbot/chat/general/'
    
    test_queries = [
        "hello i wants to learn cyber security",
        "cybersecurity basics",
        "what is cyber security",
        "learn cybersecurity",
        "information security",
        "network security"
    ]
    
    print("Testing Cybersecurity Queries:")
    print("=" * 50)
    
    for query in test_queries:
        try:
            response = requests.post(url, 
                json={'message': query},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"Query: '{query}'")
                print(f"Response: {data['response'][:150]}...")
                print("-" * 40)
                
        except Exception as e:
            print(f"Error for '{query}': {e}")

if __name__ == "__main__":
    test_cybersecurity()
