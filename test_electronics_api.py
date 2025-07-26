import requests

def test_electronics_api():
    url = 'http://localhost:8000/api/chatbot/chat/general/'
    
    test_queries = [
        "wants to learn electronics",
        "wants to learn this",
        "learn electronics", 
        "electronics basics",
        "grammar help"
    ]
    
    for query in test_queries:
        try:
            response = requests.post(url, 
                json={'message': query},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"Query: '{query}'")
                print(f"Response: {data['response'][:100]}...")
                print("-" * 50)
                
        except Exception as e:
            print(f"Error for '{query}': {e}")

if __name__ == "__main__":
    test_electronics_api()
