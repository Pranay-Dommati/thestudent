import sys
sys.path.append('backend/chatbotcourse')
from educational_vector_bot import EducationalVectorBot
import os

# Debug the vector bot
def debug_vector_bot():
    vector_store_path = os.path.join('backend', 'chatbotcourse', 'vector_store.index')
    bot = EducationalVectorBot(vector_store_path)
    
    print("Vector Bot Debug Info:")
    print("=" * 50)
    print(f"Number of questions: {len(bot.questions)}")
    print(f"Number of responses: {len(bot.responses)}")
    print(f"Questions and responses match: {len(bot.questions) == len(bot.responses)}")
    print()
    
    # Check first few questions and responses
    print("First 10 questions:")
    for i, q in enumerate(bot.questions[:10]):
        print(f"{i}: {q}")
    print()
    
    print("First 10 responses:")
    for i, r in enumerate(bot.responses[:10]):
        print(f"{i}: {r[:100]}...")
    print()
    
    # Test specific queries
    test_queries = [
        "wants to learn electronics", 
        "wants to learn this",
        "learn grammar",
        "cybersecurity"
    ]
    
    print("Testing specific queries:")
    for query in test_queries:
        try:
            response = bot.get_best_response(query)
            print(f"Query: '{query}'")
            print(f"Response: {response[:100]}...")
            print("-" * 30)
        except Exception as e:
            print(f"Error for '{query}': {e}")

if __name__ == "__main__":
    debug_vector_bot()
