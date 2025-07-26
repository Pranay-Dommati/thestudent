#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from chatbotcourse.educational_vector_bot import EducationalVectorBot

def test_electronics_response():
    print("Testing Educational Vector Bot - Electronics Query")
    print("=" * 50)
    
    # Initialize the bot
    vector_store_path = "backend/chatbotcourse/educational_vector_store.pkl"
    bot = EducationalVectorBot(vector_store_path)
    
    # Test queries
    test_queries = [
        "wants to learn electronics",
        "learn electronics", 
        "electronics basics",
        "wants to learn this",
        "electronic circuits",
        "what is electronics"
    ]
    
    print("Questions in database containing 'electronics':")
    for i, question in enumerate(bot.questions):
        if 'electronic' in question.lower():
            print(f"{i}: {question}")
    print()
    
    print("Testing queries:")
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        response = bot.get_best_response(query)
        print(f"Response: {response[:100]}...")
        
        # Show similarity scores
        query_vector = bot.vectorizer.transform([bot.preprocess_text(query)])
        question_vectors = bot.vectorizer.transform([bot.preprocess_text(q) for q in bot.questions])
        similarities = query_vector.dot(question_vectors.T).toarray()[0]
        
        # Find top 3 matches
        top_indices = similarities.argsort()[-3:][::-1]
        print("Top 3 similar questions:")
        for idx in top_indices:
            print(f"  {similarities[idx]:.4f}: {bot.questions[idx]}")

if __name__ == "__main__":
    test_electronics_response()
