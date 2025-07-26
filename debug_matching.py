import sys
sys.path.append('backend/chatbotcourse')
from educational_vector_bot import EducationalVectorBot
import os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Debug the specific matching issue
def debug_matching():
    vector_store_path = os.path.join('backend', 'chatbotcourse', 'vector_store.index')
    bot = EducationalVectorBot(vector_store_path)
    
    # Test the problematic query
    user_message = "wants to learn electronics"
    user_message_clean = bot.preprocess_text(user_message)
    
    print(f"Original query: '{user_message}'")
    print(f"Cleaned query: '{user_message_clean}'")
    print()
    
    # Vectorize the user message
    user_vector = bot.vectorizer.transform([user_message_clean])
    
    # Vectorize all stored questions
    question_vectors = bot.vectorizer.transform(bot.questions)
    
    # Calculate similarity
    similarities = cosine_similarity(user_vector, question_vectors).flatten()
    
    # Get top 10 matches
    top_indices = np.argsort(similarities)[-10:][::-1]
    
    print("Top 10 matches:")
    for i, idx in enumerate(top_indices):
        print(f"{i+1}. Score: {similarities[idx]:.4f} | Question: '{bot.questions[idx]}' | Response: '{bot.responses[idx][:80]}...'")
    print()
    
    # Find the specific response that keeps appearing
    target_response = "Learning grammar starts with understanding the building blocks"
    for i, response in enumerate(bot.responses):
        if response.startswith(target_response):
            print(f"Found problematic response at index {i}:")
            print(f"Question: '{bot.questions[i]}'")
            print(f"Response: '{response[:100]}...'")
            print()

if __name__ == "__main__":
    debug_matching()
