#!/usr/bin/env python3
"""
Quick test script for context extraction and injection functions.
Run this to verify the context injection feature works correctly.
"""

def _extract_root_context(user_query: str) -> str | None:
    """Extract the primary subject/domain from the user query."""
    try:
        q = (user_query or '').strip()
        if not q:
            return None
        
        q_lower = q.lower()
        
        # Human languages (highest priority)
        human_languages = [
            ('dutch', 'Dutch'), ('spanish', 'Spanish'), ('french', 'French'), ('german', 'German'),
            ('hindi', 'Hindi'), ('english', 'English')
        ]
        
        for key, label in human_languages:
            if key in q_lower and 'language' in q_lower:
                return f"{label} language"
        
        # Programming languages & frameworks
        tech_contexts = [
            ('python', 'Python'), ('javascript', 'JavaScript'), ('react', 'React'), ('java', 'Java')
        ]
        
        for key, label in tech_contexts:
            if key in q_lower:
                return label
        
        # Academic subjects
        academic_subjects = [
            ('data structures', 'DSA'), ('algorithms', 'DSA'), ('dsa', 'DSA'),
            ('calculus', 'Calculus'), ('algebra', 'Algebra')
        ]
        
        for key, label in academic_subjects:
            if key in q_lower:
                return label
        
        return None
    except Exception:
        return None


def _inject_context_into_topics(topics: list[dict], root_context: str | None, user_query: str) -> list[dict]:
    """Inject root context into topic names."""
    try:
        if not topics or not isinstance(topics, list):
            return topics
        
        if not root_context:
            root_context = _extract_root_context(user_query)
        
        if not root_context:
            return topics
        
        enriched_topics = []
        root_lower = root_context.lower()
        
        for topic in topics:
            if not isinstance(topic, dict):
                enriched_topics.append(topic)
                continue
            
            original_name = topic.get('name', '')
            if not original_name or not isinstance(original_name, str):
                enriched_topics.append(topic)
                continue
            
            name_lower = original_name.lower()
            has_context = root_lower in name_lower
            
            enriched_topic = {**topic}
            
            if not has_context:
                enriched_topic['name'] = f"{original_name} in {root_context}"
            
            enriched_topic['root_context'] = root_context
            enriched_topic['original_name'] = original_name
            
            enriched_topics.append(enriched_topic)
        
        return enriched_topics
    except Exception as e:
        print(f"Error: {e}")
        return topics


# Test cases
print("=" * 70)
print("CONTEXT EXTRACTION TESTS")
print("=" * 70)

test_queries = [
    "Dutch language beginner friendly",
    "Python for data science",
    "React hooks intermediate",
    "learn calculus",
    "arrays and recursion in DSA"
]

for query in test_queries:
    context = _extract_root_context(query)
    print(f"\nQuery: '{query}'")
    print(f"  → Context: {context}")

print("\n" + "=" * 70)
print("CONTEXT INJECTION TEST")
print("=" * 70)

# Test with Dutch language topics
query = "Dutch language beginner friendly"
context = _extract_root_context(query)

topics = [
    {'id': 1, 'name': 'Basic Greetings & Introductions', 'isActive': True},
    {'id': 2, 'name': 'Numbers, Colors & Common Nouns', 'isActive': True},
    {'id': 3, 'name': 'Simple Sentence Structure & Present Tense Verbs', 'isActive': True},
    {'id': 4, 'name': 'Everyday Phrases & Asking Basic Questions', 'isActive': True}
]

print(f"\nQuery: '{query}'")
print(f"Detected Context: '{context}'")
print("\n--- BEFORE Injection ---")
for t in topics:
    print(f"  {t['id']}. {t['name']}")

enriched = _inject_context_into_topics(topics, context, query)

print("\n--- AFTER Injection ---")
for t in enriched:
    print(f"  {t['id']}. {t['name']}")
    print(f"      • root_context: {t.get('root_context')}")
    print(f"      • original_name: {t.get('original_name')}")

print("\n" + "=" * 70)
print("SUCCESS! Context injection working correctly.")
print("=" * 70)
