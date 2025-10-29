# Context Injection Feature

## Problem Statement

When generating course topics from prompts like "Dutch language beginner friendly", the AI would create topics like:
- "Basic Greetings & Introductions"
- "Numbers, Colors & Common Nouns"
- "Simple Sentence Structure & Present Tense Verbs"

While these topics are well-structured, they lack the critical domain context ("Dutch language"). When downstream AI services (reading material, quizzes, videos, resources) process these topics independently, they don't know what subject area to generate content for, leading to failures or irrelevant content.

## Solution: Hybrid Context Injection

We implemented a two-pronged approach as recommended by senior engineers:

### 1. **Automatic Context Injection** (Solution 1)
After topics are generated, the system automatically:
- Extracts the root context from the user query
- Appends it to each topic name to make them self-contained
- Ensures downstream services always have the full context

**Example:**
```
Input: "Dutch language beginner friendly"
Root Context: "Dutch language"

Before:
1. Basic Greetings & Introductions
2. Numbers, Colors & Common Nouns

After:
1. Basic Greetings & Introductions in Dutch language
2. Numbers, Colors & Common Nouns in Dutch language
```

### 2. **Metadata Tagging** (Solution 3)
Each topic now includes structured metadata:
```json
{
  "id": 1,
  "name": "Basic Greetings & Introductions in Dutch language",
  "isActive": true,
  "root_context": "Dutch language",
  "original_name": "Basic Greetings & Introductions"
}
```

This enables:
- **Self-contained topics**: The `name` field includes full context
- **Flexible processing**: Services can use `root_context` for filtering/querying
- **Preservation**: `original_name` keeps the AI-generated title intact
- **Future-proofing**: Easy to add multi-language support, category filtering, etc.

## Implementation Details

### Core Functions

#### `_extract_root_context(user_query: str) -> str | None`
Intelligently extracts the primary subject/domain from user queries.

**Supported contexts:**
- **Human Languages**: Dutch, Spanish, French, German, Hindi, Telugu, English, etc. (30+ languages)
- **Programming Languages**: Python, JavaScript, TypeScript, Java, C++, React, Django, etc.
- **Academic Subjects**: DSA, Calculus, Algebra, Trigonometry, Physics, Chemistry, etc.

**Priority order:**
1. Human languages (checks for "language" keyword)
2. Programming languages & frameworks
3. Academic subjects

#### `_inject_context_into_topics(topics, root_context, user_query) -> list[dict]`
Enriches topic objects with context while preserving all original data.

**Features:**
- Skips injection if context already exists in topic name
- Adds metadata fields: `root_context`, `original_name`
- Handles edge cases gracefully (empty topics, malformed data)
- Logs context injection in debug mode

### Integration Points

Context injection happens automatically in two places:

1. **DIRECT mode** (explicit topic lists):
   - After parsing user-specified topics like "arrays, recursion, hash maps in Python"
   - Ensures even explicit lists have proper context

2. **BROAD mode** (curriculum generation):
   - After AI generates 2-4 topics from general queries
   - Makes curriculum topics fully self-contained

### API Response Structure

```json
{
  "topics": [
    {
      "id": 1,
      "name": "Basic Greetings & Introductions in Dutch language",
      "isActive": true,
      "root_context": "Dutch language",
      "original_name": "Basic Greetings & Introductions"
    }
  ],
  "personalization": "Beginner-friendly, step-by-step explanations...",
  "debug_meta": {
    "intent": "broad",
    "topics_count": 4,
    "root_context": "Dutch language"
  }
}
```

## Benefits

### For Downstream Services

**Reading Material Generator:**
```python
# Before: AI doesn't know the subject
prompt = f"Create reading material for: {topic['name']}"
# "Create reading material for: Basic Greetings & Introductions"

# After: Full context available
prompt = f"Create reading material for: {topic['name']}"
# "Create reading material for: Basic Greetings & Introductions in Dutch language"
```

**Quiz Generator:**
- Now knows to generate Dutch language questions
- Can access `root_context` for explicit filtering

**Video Search:**
- Searches for "Dutch language basic greetings" instead of just "basic greetings"
- Returns relevant results consistently

**Resources Finder:**
- Finds Dutch language learning resources
- Avoids generic or unrelated content

### For Users
- ✅ **Consistent experience**: All generated content is relevant
- ✅ **No ambiguity**: Topics clearly indicate what they're about
- ✅ **Better discovery**: Context-rich titles are more searchable
- ✅ **Error reduction**: Fewer "couldn't generate content" failures

## Testing

Run the test suite:
```bash
cd backend
python test_context_injection.py
```

Expected output shows:
- Context extraction for various query types
- Before/after topic names
- Metadata structure

## Future Enhancements

1. **Smart Context Detection**: Use AI to verify extracted context is correct
2. **Multi-Context Support**: Handle queries with multiple domains (e.g., "Python for web development")
3. **User Override**: Allow users to manually adjust context if auto-detection fails
4. **Analytics**: Track which contexts are most commonly requested
5. **Localization**: Support context injection in multiple UI languages

## Architecture Decision Record (ADR)

**Decision**: Implement hybrid context injection (Solution 1 + Solution 3)

**Rationale**:
- Solution 1 (name injection) makes topics immediately usable by all services
- Solution 3 (metadata) provides structured data for future extensibility
- Combining both gives us short-term reliability and long-term flexibility

**Alternatives Considered**:
- ❌ Prompt engineering only: Too unreliable due to AI variability
- ❌ Metadata only: Requires all services to be updated to read metadata
- ✅ **Hybrid approach**: Works with existing services AND enables new features

**Status**: Implemented ✅

---

**Last Updated**: October 30, 2025  
**Author**: Engineering Team  
**Reviewed By**: Senior Software Engineer (30 years experience)
