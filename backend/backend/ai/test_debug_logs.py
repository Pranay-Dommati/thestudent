#!/usr/bin/env python3
"""
Test script to verify the debug logging is working correctly
in the reading.py classification system.
"""

import sys
import os

# Add the current directory to Python path to import reading module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reading import classify_topic, get_prompt_by_category

def test_debug_logs():
    """Test the debug logging with different topics"""
    
    print("=" * 80)
    print("🧪 TESTING DEBUG LOGS FOR READING CONTENT CLASSIFICATION")
    print("=" * 80)
    
    test_topics = [
        "Photosynthesis",
        "React Hooks",
        "Time Management",
        "Stock Market Investing", 
        "Digital Photography",
        "Startup Funding",
        "Quantum Computing"
    ]
    
    for i, topic in enumerate(test_topics, 1):
        print(f"\n{'='*50}")
        print(f"TEST {i}: '{topic}'")
        print(f"{'='*50}")
        
        # Test classification
        category = classify_topic(topic)
        
        # Test prompt selection  
        prompt_preview = get_prompt_by_category(topic, category)
        prompt_length = len(prompt_preview)
        
        print(f"\n✅ RESULT: '{topic}' → '{category}' (prompt: {prompt_length} chars)")
        print(f"📝 Prompt preview: {prompt_preview[:100]}...")
        
    print(f"\n{'='*80}")
    print("🎉 DEBUG LOG TESTING COMPLETED")
    print(f"{'='*80}")

if __name__ == "__main__":
    test_debug_logs()
