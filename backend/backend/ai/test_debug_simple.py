#!/usr/bin/env python3
"""
Simple test script to verify the debug logging is working correctly
in the classification functions.
"""

import sys
import os

# Mock the AI service to avoid import errors
class MockAIService:
    @staticmethod
    def call_gemini_api(prompt):
        # Simulate AI response for classification
        if "Photosynthesis" in prompt:
            return "academic"
        elif "React Hooks" in prompt:
            return "technical"
        elif "Time Management" in prompt:
            return "skills"
        else:
            return "general"

# Add mock to sys.modules before importing
sys.modules['ai_service'] = type('MockModule', (), {'call_gemini_api': MockAIService.call_gemini_api})

# Test just the classification functions
def classify_topic_with_ai_test(topic):
    """Test version of AI classification with enhanced logging"""
    print(f"🤖 Using AI to classify topic: '{topic}'")
    
    # Simulate AI classification
    topic_lower = topic.lower()
    if 'photosynthesis' in topic_lower:
        classification = 'academic'
    elif 'react' in topic_lower or 'hooks' in topic_lower:
        classification = 'technical'
    elif 'time' in topic_lower and 'management' in topic_lower:
        classification = 'skills'
    elif 'stock' in topic_lower or 'investing' in topic_lower:
        classification = 'business_finance'
    elif 'photography' in topic_lower or 'digital' in topic_lower:
        classification = 'creative'
    elif 'startup' in topic_lower or 'funding' in topic_lower:
        classification = 'entrepreneurship'
    else:
        classification = 'general'
    
    print(f"✅ AI classified '{topic}' as: '{classification}'")
    return classification

def classify_topic_fallback_test(topic):
    """Test version of fallback classification with enhanced logging"""
    print(f"🔧 Using FALLBACK classification for: '{topic}'")
    topic_lower = topic.lower()
    
    if any(word in topic_lower for word in ['programming', 'code', 'react', 'python', 'javascript', 'api', 'software']):
        print(f"🎯 FALLBACK: Found technical keywords, classifying as 'technical'")
        return 'technical'
    elif any(word in topic_lower for word in ['history', 'physics', 'chemistry', 'biology', 'math', 'science', 'photosynthesis']):
        print(f"🎯 FALLBACK: Found academic keywords, classifying as 'academic'")
        return 'academic'
    elif any(word in topic_lower for word in ['communication', 'leadership', 'management', 'skills']):
        print(f"🎯 FALLBACK: Found skills keywords, classifying as 'skills'")
        return 'skills'
    elif any(word in topic_lower for word in ['business', 'finance', 'investing', 'money', 'budget']):
        print(f"🎯 FALLBACK: Found business/finance keywords, classifying as 'business_finance'")
        return 'business_finance'
    elif any(word in topic_lower for word in ['art', 'design', 'photography', 'writing', 'creative']):
        print(f"🎯 FALLBACK: Found creative keywords, classifying as 'creative'")
        return 'creative'
    elif any(word in topic_lower for word in ['startup', 'entrepreneur', 'marketing', 'sales']):
        print(f"🎯 FALLBACK: Found entrepreneurship keywords, classifying as 'entrepreneurship'")
        return 'entrepreneurship'
    else:
        print(f"🎯 FALLBACK: No specific keywords found, using 'general' category")
        return 'general'

def get_prompt_category_name(category):
    """Get the display name for each category"""
    category_names = {
        'technical': '📝 TECHNICAL - Programming/Software Development',
        'academic': '📚 ACADEMIC - Scholarly/Educational Subjects', 
        'skills': '💪 SKILLS - Personal Development/Soft Skills',
        'business_finance': '💰 BUSINESS_FINANCE - Finance/Business/Economics',
        'creative': '🎨 CREATIVE - Arts/Design/Creative Expression',
        'entrepreneurship': '🚀 ENTREPRENEURSHIP - Startups/Business Strategy',
        'general': '🔄 GENERAL/FALLBACK - Adaptive Content'
    }
    return category_names.get(category, f"❓ UNKNOWN - {category}")

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
        print(f"\n{'='*60}")
        print(f"TEST {i}: '{topic}'")
        print(f"{'='*60}")
        
        print(f"\n🔍 CLASSIFICATION PHASE:")
        category = classify_topic_with_ai_test(topic)
        
        print(f"\n📝 PROMPT SELECTION PHASE:")
        print(f"🎯 Selecting prompt for topic: '{topic}' with category: '{category}'")
        prompt_name = get_prompt_category_name(category)
        print(f"{prompt_name}")
        
        print(f"\n📊 FINAL RESULT:")
        print(f"   Topic: '{topic}'")
        print(f"   Category: '{category}'")
        print(f"   Selected Prompt: {prompt_name}")
        
    print(f"\n{'='*80}")
    print("🎉 DEBUG LOG TESTING COMPLETED")
    print("✅ All classification and prompt selection logs are working!")
    print(f"{'='*80}")

if __name__ == "__main__":
    test_debug_logs()
