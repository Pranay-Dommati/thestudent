from django.http import JsonResponse
from django.conf import settings
import json
import re
from .ai_service import call_gemini_api, call_gemini_flash_api

def classify_topic_with_ai(topic):
    """
    Use Gemini 1.5 Pro to intelligently classify topic and select best prompt.
    Falls back to keyword classification on any AI/formatting issue.
    """
    print(f"🤖 Analyzing topic with AI: {topic}")
    
    # Create a prompt for AI to analyze the topic and choose the best category
    analysis_prompt = f"""You are an expert educational content categorizer. Analyze the given topic and determine which category it best fits into for educational content generation.

Available Categories:
1. **technical** - Programming languages, software development, frameworks, APIs, databases, system design, computer science fundamentals, coding concepts, development tools
2. **academic** - History, Physics, Mathematics, Chemistry, Biology, Economics, Psychology, Geography, Literature, Sciences, traditional academic subjects
3. **skills** - Communication, leadership, time management, emotional intelligence, confidence, personal development, soft skills, interpersonal skills
4. **business_finance** - Finance, investing, accounting, budgeting, financial literacy, personal finance, business concepts (general business topics)
5. **creative** - Writing, storytelling, design, photography, filmmaking, content creation, media production, artistic skills
6. **entrepreneurship** - Startups, business models, marketing strategies, entrepreneurship, business strategy, launching businesses
7. **general** - Topics that don't clearly fit into any of the above categories

Topic to analyze: "{topic}"

Instructions:
- Analyze the topic carefully considering its primary focus and learning objectives
- Choose the SINGLE most appropriate category from the list above
- If the topic could fit multiple categories, choose the one that would provide the best educational experience
- Only use "general" if the topic truly doesn't fit any other category well

Respond with ONLY the category name (technical, academic, skills, business_finance, creative, entrepreneurship, or general). No explanation needed."""

    try:
        print(f"🎯 Sending topic analysis request to Gemini 1.5 Pro...")
        response_data = call_gemini_api(analysis_prompt)

        # Extract the response text safely
        if isinstance(response_data, dict) and response_data.get('candidates'):
            candidate = response_data['candidates'][0]
            parts = (
                candidate.get('content', {}).get('parts')
                if isinstance(candidate.get('content'), dict)
                else None
            )
            text = None
            if isinstance(parts, list) and parts:
                first = parts[0]
                if isinstance(first, dict):
                    text = first.get('text')
            # Fallbacks
            if not isinstance(text, str) or not text.strip():
                # Try other shapes
                text = candidate.get('text') if isinstance(candidate, dict) else None

            if isinstance(text, str) and text.strip():
                category = text.strip().lower()

                # Validate the category
                valid_categories = ['technical', 'academic', 'skills', 'business_finance', 'creative', 'entrepreneurship', 'general']
                if category in valid_categories:
                    print(f"✅ AI classified '{topic}' as: {category}")
                    return category
                else:
                    print(f"⚠️ AI returned invalid category '{category}', falling back to keyword classification")
                    return classify_topic(topic)

        print("❌ Invalid or empty response from Gemini 1.5 Pro, falling back to keyword classification")
        return classify_topic(topic)

    except Exception as e:
        print(f"❌ AI classification failed: {e}")
        print("🔄 Falling back to keyword-based classification")
        # Fall back to the original keyword-based classification
        return classify_topic(topic)

def classify_topic(topic):
    """
    Classify the topic into appropriate category for prompt selection
    """
    print(f"🔄 Using keyword-based classification for: '{topic}'")
    topic_lower = topic.lower()
    
    # Technical Topics Keywords
    technical_keywords = [
        'programming', 'code', 'coding', 'python', 'javascript', 'java', 'c++', 'html', 'css',
        'react', 'angular', 'vue', 'nodejs', 'django', 'flask', 'api', 'database', 'sql',
        'mongodb', 'algorithm', 'data structure', 'machine learning', 'ai', 'artificial intelligence',
        'deep learning', 'neural network', 'framework', 'library', 'git', 'github', 'docker',
        'kubernetes', 'aws', 'cloud', 'server', 'backend', 'frontend', 'fullstack', 'devops',
        'cybersecurity', 'blockchain', 'cryptocurrency', 'web development', 'mobile development',
        'software', 'hardware', 'network', 'system design', 'architecture', 'microservices',
        'debugging', 'testing', 'deployment', 'version control', 'agile', 'scrum'
    ]
    
    # Academic & Knowledge Keywords
    academic_keywords = [
        'history', 'physics', 'chemistry', 'biology', 'mathematics', 'math', 'science',
        'geography', 'literature', 'philosophy', 'psychology', 'sociology', 'anthropology',
        'economics', 'political science', 'law', 'medicine', 'anatomy', 'physiology',
        'astronomy', 'geology', 'ecology', 'evolution', 'genetics', 'quantum', 'relativity',
        'theory', 'research', 'study', 'academic', 'scholarly', 'scientific method',
        'hypothesis', 'experiment', 'analysis', 'statistics', 'probability'
    ]
    
    # Skills & Personal Development Keywords
    skills_keywords = [
        'communication', 'leadership', 'time management', 'productivity', 'confidence',
        'emotional intelligence', 'teamwork', 'collaboration', 'presentation', 'public speaking',
        'negotiation', 'conflict resolution', 'problem solving', 'critical thinking',
        'creativity', 'innovation', 'motivation', 'goal setting', 'habit', 'mindset',
        'stress management', 'work-life balance', 'networking', 'mentoring', 'coaching',
        'personal development', 'self improvement', 'career development', 'interview skills'
    ]
    
    # Business & Finance Keywords
    business_finance_keywords = [
        'business', 'finance', 'investing', 'investment', 'stock', 'market', 'trading',
        'cryptocurrency', 'bitcoin', 'portfolio', 'budget', 'budgeting', 'accounting',
        'financial planning', 'retirement', 'insurance', 'loan', 'mortgage', 'credit',
        'debt', 'savings', 'profit', 'revenue', 'roi', 'startup', 'entrepreneur',
        'venture capital', 'funding', 'ipo', 'valuation', 'cash flow', 'balance sheet',
        'income statement', 'financial analysis', 'risk management', 'wealth building'
    ]
    
    # Creative Arts & Media Keywords
    creative_keywords = [
        'writing', 'storytelling', 'creative writing', 'screenplay', 'novel', 'poetry',
        'journalism', 'copywriting', 'content creation', 'blogging', 'photography',
        'filmmaking', 'video editing', 'graphic design', 'ui design', 'ux design',
        'illustration', 'animation', 'music', 'singing', 'acting', 'theater', 'drama',
        'art', 'painting', 'drawing', 'sculpture', 'digital art', 'media production',
        'social media', 'marketing content', 'brand storytelling', 'visual design'
    ]
    
    # Entrepreneurship Keywords
    entrepreneurship_keywords = [
        'entrepreneurship', 'startup', 'business model', 'marketing', 'sales', 'growth',
        'scaling', 'pivot', 'mvp', 'minimum viable product', 'lean startup', 'fundraising',
        'pitch deck', 'business plan', 'market research', 'customer acquisition',
        'revenue model', 'monetization', 'branding', 'digital marketing', 'seo',
        'social media marketing', 'email marketing', 'content marketing', 'affiliate marketing',
        'e-commerce', 'dropshipping', 'freelancing', 'consulting', 'coaching business'
    ]
    
    # Check each category and log the result
    if any(keyword in topic_lower for keyword in technical_keywords):
        print(f"🔧 Keyword classification result: '{topic}' → 'technical'")
        return 'technical'
    elif any(keyword in topic_lower for keyword in academic_keywords):
        print(f"📚 Keyword classification result: '{topic}' → 'academic'")
        return 'academic'
    elif any(keyword in topic_lower for keyword in skills_keywords):
        print(f"💪 Keyword classification result: '{topic}' → 'skills'")
        return 'skills'
    elif any(keyword in topic_lower for keyword in business_finance_keywords):
        print(f"💰 Keyword classification result: '{topic}' → 'business_finance'")
        return 'business_finance'
    elif any(keyword in topic_lower for keyword in creative_keywords):
        print(f"🎨 Keyword classification result: '{topic}' → 'creative'")
        return 'creative'
    elif any(keyword in topic_lower for keyword in entrepreneurship_keywords):
        print(f"🚀 Keyword classification result: '{topic}' → 'entrepreneurship'")
        return 'entrepreneurship'
    else:
        print(f"❓ Keyword classification result: '{topic}' → 'general' (no keywords matched)")
        return 'general'

def get_prompt_by_category(topic, category):
    """
    Return the appropriate prompt based on topic category
    """
    print(f"📝 Selecting prompt for category: '{category}' and topic: '{topic}'")
    
    if category == 'technical':
        print(f"🔧 Using TECHNICAL prompt for topic: '{topic}'")
        print(f"🎯 PROMPT IDENTIFIER: TECHNICAL_PROMPT_V2024 - Programming/Development Focus")
        return f"""You are an expert software engineering instructor and technical mentor. Generate comprehensive, professional educational content on **technical topics** including programming concepts, software development practices, frameworks, system design, and computer science fundamentals.

Your task is to create a detailed **Reading Section** using **Markdown syntax** that serves as a complete learning resource for developers, from beginners to intermediate level.

🎯 **Tone & Style Guidelines**:
- Professional yet accessible - like a senior developer explaining to a junior colleague
- Clear, precise technical language without unnecessary jargon
- Use technical analogies only when they genuinely clarify complex concepts
- Focus on practical understanding and real-world application
- Maintain educational authority while being approachable

📘 **Content Must Include**:
- ✅ **Technical Definition**: Clear, accurate explanation of what the concept is
- ✅ **Core Sections** using these Markdown headers:
  - `## Introduction`
  - `## Why it Matters` (business/technical benefits)
  - `## How it Works` (technical mechanics)
  - `## Key Concepts` (important terminology and principles)
  - `## Code Examples` (practical, real-world implementations with explanations)
  - `## Common Use Cases` (where and when to apply)
  - `## Best Practices` (industry-standard approaches)
- ✅ **Code Quality**:
  - Use realistic, meaningful variable names and examples
  - Include inline comments explaining key concepts
  - Show multiple implementation approaches when relevant
  - Use industry-standard patterns and conventions
- ✅ **Formatting**:
  - `**bold**` for key technical terms
  - Bullet points for lists and features
  - Numbered steps for procedures and workflows
  - Proper code blocks with language identifiers

🚫 **Avoid**:
- Overly casual analogies that trivialize the topic
- Summary sections
- Quiz questions
- External links or references
- Buzzwords without substance

---

## INPUT FORMAT:
{topic}

## OUTPUT FORMAT:
Return the content **only in Markdown format**, beginning directly with `## Introduction` and continuing with the specified sections."""

    elif category == 'academic':
        print(f"📚 Using ACADEMIC prompt for topic: '{topic}'")
        return f"""You are an expert AI tutor trained to explain **academic or general knowledge subjects** such as History, Physics, Economics, Psychology, Biology, etc.

Given a topic by the user, generate a **detailed, easy-to-understand Reading Section** using **Markdown format**. The content should be self-contained and suitable for students and lifelong learners aiming to understand the topic deeply.

🎯 **Tone & Style Guidelines**:
- Clear, engaging, and student-friendly.
- Avoid jargon unless explained.
- Think like a passionate teacher who wants the learner to genuinely understand.

📘 **Content Must Include**:
- ✅ Explanation of the topic from basics.
- ✅ Organize content using these Markdown headers:
  - `## Introduction`
  - `## Historical/Scientific Background` *(use only if relevant)*
  - `## Core Concepts`
  - `## Real-World Relevance`
  - `## Diagrams or Visual Description` *(describe if real images can't be embedded)*
  - `## Examples or Case Studies`
  - `## Interesting Facts` *(optional)*
- ✅ Use formatting:
  - `**bold**` for key terms
  - Bullet points for breakdowns
  - Numbered steps for logical processes
  - Backticks (```) only for formatting, not for code

🚫 **Do NOT include**:
- Summary
- Quiz
- Links to sources

---

## INPUT FORMAT:
{topic}

## OUTPUT FORMAT:
Return the content **only in Markdown format**, beginning directly with `## Introduction` and continuing with the sections listed above."""

    elif category == 'skills':
        print(f"💪 Using SKILLS prompt for topic: '{topic}'")
        return f"""You are a professional coach and educator skilled in teaching **soft skills and personal development topics** like communication, confidence, time management, emotional intelligence, leadership, etc.

Given a topic by the user, generate a clear and structured **Reading Section** in **Markdown format** that helps individuals learn and grow in this area—whether for career, personal life, or relationships.

🎯 **Tone & Style Guidelines**:
- Friendly, motivational, and practical.
- Easy to understand for beginners.
- Include real-life applications wherever possible.

📘 **Content Must Include**:
- ✅ Explanation of the topic with depth
- ✅ Organize content using these Markdown headers:
  - `## Introduction`
  - `## Why It Matters`
  - `## Core Principles or Techniques`
  - `## Real-Life Applications`
  - `## Common Mistakes`
  - `## Practical Tips or Exercises`
  - `## Inspirational Examples` *(optional)*

- ✅ Use formatting:
  - `**bold**` for key terms
  - Bullet points for strategies and lists
  - Use direct, actionable language
  - Avoid fluff and vague ideas

🚫 **Do NOT include**:
- Summary
- Quiz
- Links to sources

---

## INPUT FORMAT:
{topic}

## OUTPUT FORMAT:
Return the content **only in Markdown format**, beginning directly with `## Introduction` and continuing with the sections listed above."""

    elif category == 'business_finance':
        print(f"💰 Using BUSINESS_FINANCE prompt for topic: '{topic}'")
        return f"""You are an expert AI tutor designed to generate complete, clear, and deeply engaging educational content on **business and finance** topics—such as entrepreneurship, marketing, investing, financial literacy, personal finance, business models, and startups.

When a user provides a topic, generate a full *Reading Section* that feels like a high-quality self-paced learning resource for students, early professionals, founders, and finance enthusiasts.

✅ Guidelines to follow:

- Explain the **fundamentals**: What it is, why it matters, and its relevance in real-world business or finance contexts.
- Include sections like **strategies, frameworks, examples**, and if applicable, **simple calculations or models**.
- Use a **clear, semi-formal tone** — professional but friendly — like a mentor explaining to a motivated learner.
- Break content using visual structure: subheadings (`##`, `###`), bullet points, numbered lists, callouts, and bold keywords.
- Relate the topic to **real-world examples** like companies, case studies, market scenarios, or personal finance cases.
- Avoid robotic definitions. Focus on **storytelling, intuition, and clarity**.
- You may include simplified **formulas or charts (as markdown)** where needed, to enhance clarity.
- Do **not generate a quiz, summary, or external resources** — only the *reading section*.

You are encouraged to take creative freedom to deeply explain and contextualize the topic for maximum learning and retention.

## INPUT FORMAT:
{topic}

## OUTPUT FORMAT:
Start directly with the markdown content, using a format like:

- Introduction  
- Real-World Importance  
- How it Works / Core Concepts  
- Frameworks or Techniques  
- Practical Examples or Case Studies  
- Tips, Mistakes to Avoid, or Best Practices"""

    elif category == 'creative':
        print(f"🎨 Using CREATIVE prompt for topic: '{topic}'")
        return f"""You are a creative mentor AI that helps learners master topics related to **creative arts, writing, storytelling, filmmaking, design, photography, content creation, and media production**.

Your job is to generate a *Reading Section* that feels like a personal guide from a creative industry expert — full of insight, examples, and inspiration.

✅ Guidelines to follow:

- Start with a **motivating introduction** that captures the soul of the topic.
- Offer **conceptual clarity + practical insights** — help learners understand both the *art and craft* behind the topic.
- Include techniques, frameworks, and tips followed by real creators or used in the industry.
- Use a friendly, inspiring tone — like a mentor guiding a passionate beginner.
- Structure the content in markdown: use `##` for sections, **bold** for emphasis, bullet points, numbered steps.
- Add **mini case studies, analogies, creative challenges, or examples** from books, films, or art if possible.
- Balance emotion with technique — speak to the heart *and* the hands of the learner.
- Don't include summary, quiz, or further reading links — this is *only* the reading module.

Make the learner *feel* like they're stepping into a world of imagination with structure.

## INPUT FORMAT:
{topic}

## OUTPUT FORMAT:
Start with markdown output like this:

- Introduction  
- Why It's Powerful or Important  
- Core Techniques / Creative Principles  
- Real-Life Creative Process Examples  
- Challenges & Practice Advice  
- Tips from Artists or Creators  
- Common Blocks and How to Overcome Them"""

    elif category == 'entrepreneurship':
        print(f"🚀 Using ENTREPRENEURSHIP prompt for topic: '{topic}'")
        print(f"🎯 PROMPT IDENTIFIER: ENTREPRENEURSHIP_V2024 - Business Strategy")
        return f"""You are an expert business mentor and entrepreneurship educator specializing in **startups, business strategy, marketing, venture capital, business models, and entrepreneurship fundamentals**.

Your task is to create a comprehensive **Reading Section** using **Markdown syntax** that serves as a complete learning resource for aspiring entrepreneurs and business professionals.

🎯 **Tone & Style Guidelines**:
- Professional yet inspiring - like a successful entrepreneur sharing wisdom
- Use business terminology appropriately while remaining accessible
- Focus on practical application and real-world business insights
- Include concrete examples from successful companies and startups
- Maintain entrepreneurial energy while being educational

📈 **Content Must Include**:
- ✅ **Business Context**: Why this concept matters in entrepreneurship and business
- ✅ **Core Sections** using these Markdown headers:
  - `## Introduction`
  - `## Real-World Relevance` (market impact and business importance)
  - `## Core Concepts and Frameworks` (key business principles and models)
  - `## Case Study or Analogy` (real company examples or business analogies)
  - `## Application Steps` (practical implementation guidance)
  - `## Industry Insights / Expert Tips` (professional advice and best practices)
  - `## Pitfalls to Avoid` (common mistakes and how to prevent them)
- ✅ **Business Examples**:
  - Use real companies and startups as examples (Google, Tesla, Airbnb, etc.)
  - Include relevant business metrics and outcomes when possible
  - Show both successful implementations and lessons from failures
- ✅ **Formatting**:
  - `**bold**` for key business terms and concepts
  - Bullet points for strategies, features, and benefits
  - Numbered steps for processes and implementation plans
  - Professional tone throughout

🚫 **Avoid**:
- Overly casual language that undermines business credibility
- Generic advice without specific business context
- Theoretical concepts without practical application
- Missing any of the required markdown headers

**Topic**: {topic}

Generate comprehensive, professionally-formatted content that helps readers understand both the concept and its practical business application."""

    else:  # general/fallback
        print(f"❓ Using GENERAL (fallback) prompt for topic: '{topic}'")
        print(f"🎯 PROMPT IDENTIFIER: GENERAL_FALLBACK_V2024 - Adaptive Content")
        return f"""You are a world-class educator and expert communicator. Generate a **deep, clear, and adaptive markdown learning guide** for the topic: **{topic}**.

Your job is to teach the topic like a personal tutor. The learner should fully understand it just by reading this — no other websites, videos, or resources needed.

Adapt your style based on the topic type:
- If the topic is **technical**, include clean code blocks, syntax, walkthroughs, real examples.
- If the topic is **non-technical**, focus on intuitive breakdowns, visuals (via analogy), examples, and real-life connections.
- Don't force irrelevant sections — adapt naturally to the topic's nature.

---

### 🧠 Structure (Use only what fits the topic):

## 📘 {topic}: Full Learning Guide

### 🔹 1. Introduction
- What is it?
- Why is it important?
- Where is it used or seen in real life?

### 🔹 2. Deep Explanation
- Explain the core ideas in simple terms.
- Use analogies, metaphors, and visuals.
- Include friendly notes like:
  > 💡 Did you know?  
  > ✅ Tip  
  > 🚫 Common mistake  

### 🔹 3. If Applicable:
- How it works / The process
- Types / Classifications
- Real-World Use Cases
- Related Concepts or Fields

### 🔹 4. If Technical:
- Use properly formatted code blocks with language identifiers (like ```python)
- Add inline comments and explain each block
- Show expected output in a separate code block
- Include a mini use case or demo

```python
# Example: Greeting Function
def greet(name):
    print(f"Hello, {{name}}!")

greet("Charan")
```

**Expected output:**
```
Hello, Charan!
```

### 🔹 5. Final Takeaways
- Key points to remember
- How to apply this knowledge
- Next steps for learning

Generate only the markdown content. Be comprehensive but concise."""

def handle_reading(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        topic = body.get('topic', '')
        
        print(f"\n{'='*60}")
        print(f"🚀 STARTING AI PROMPT SELECTION PROCESS")
        print(f"{'='*60}")
        print(f"📥 Input Topic: '{topic}'")
        print(f"🤖 Method: AI-Powered Classification (Primary) + Keyword Fallback (Backup)")
        
        # Classify the topic using AI and get appropriate prompt
        category = classify_topic_with_ai(topic)
        
        print(f"🎯 FINAL CATEGORY SELECTED: '{category.upper()}'")
        
        # Get the appropriate prompt
        prompt = get_prompt_by_category(topic, category)
        
        print(f"� ACTUAL PROMPT BEING USED:")
        print(f"{'='*40}")
        print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
        print(f"{'='*40}")
        
        print(f"�📤 Sending to Gemini API with {category.upper()} prompt...")
        print(f"{'='*60}")
        
        result = call_gemini_api(prompt)
        
        print(f"✅ Content generated successfully!")
        
        # Analyze if the response matches the expected prompt format
        if isinstance(result, dict) and 'content' in result:
            content_text = result['content']
        elif isinstance(result, str):
            content_text = result
        else:
            content_text = str(result)
            
        print(f"🔍 RESPONSE ANALYSIS:")
        print(f"   • Content length: {len(content_text)} characters")
        
        # Check for technical prompt indicators
        if category == 'technical':
            tech_indicators = ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function']
            found_indicators = [indicator for indicator in tech_indicators if indicator.lower() in content_text.lower()]
            print(f"   • Technical indicators found: {found_indicators}")
            if len(found_indicators) >= 2:
                print(f"   ✅ Response appears to match TECHNICAL prompt")
            else:
                print(f"   ⚠️ Response may NOT match TECHNICAL prompt (few technical indicators)")
        
        print(f"📊 CLASSIFICATION SUMMARY:")
        print(f"   • Topic: '{topic}'")
        print(f"   • Category: '{category}'")
        print(f"   • Method: AI-Powered")
        print(f"   • Status: Success")
        print(f"{'='*60}\n")
        
        # Add category to the response for debugging/frontend usage
        if isinstance(result, dict):
            result['topic_category'] = category
            result['classification_method'] = 'ai_powered'
            result['topic_analyzed'] = topic
            result['prompt_info'] = {
                'category': category,
                'prompt_id': f"{category.upper()}_PROMPT_V2024" if category != 'general' else 'GENERAL_FALLBACK_V2024',
                'prompt_description': get_prompt_description(category),
                'expected_content_type': get_expected_content_type(category)
            }
            result['backend_analysis'] = {
                'content_length': len(content_text),
                'word_count_estimate': len(content_text.split()),
                'technical_indicators_found': len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) if category == 'technical' else None,
                'verification_status': 'passed' if category != 'technical' or len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) >= 2 else 'warning'
            }
        else:
            # If result is not a dict, wrap it with metadata
            result = {
                'content': result,
                'topic_category': category,
                'classification_method': 'ai_powered',
                'topic_analyzed': topic,
                'prompt_info': {
                    'category': category,
                    'prompt_id': f"{category.upper()}_PROMPT_V2024" if category != 'general' else 'GENERAL_FALLBACK_V2024',
                    'prompt_description': get_prompt_description(category),
                    'expected_content_type': get_expected_content_type(category)
                },
                'backend_analysis': {
                    'content_length': len(content_text),
                    'word_count_estimate': len(content_text.split()),
                    'technical_indicators_found': len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) if category == 'technical' else None,
                    'verification_status': 'passed' if category != 'technical' or len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) >= 2 else 'warning'
                }
            }
        
        return JsonResponse(result, safe=False)
    except Exception as e:
        print(f"❌ ERROR in handle_reading:")
        print(f"   • Topic: '{topic if 'topic' in locals() else 'unknown'}'")
        print(f"   • Category: '{category if 'category' in locals() else 'unknown'}'")
        print(f"   • Error: {str(e)}")
        print(f"{'='*60}\n")
        
        return JsonResponse({
            'error': str(e),
            'topic_category': category if 'category' in locals() else 'unknown',
            'topic_analyzed': topic if 'topic' in locals() else 'unknown'
        }, status=500)

def get_prompt_description(category):
    """Return user-friendly description of the prompt category"""
    descriptions = {
        'technical': 'Programming/Development Focus - Code examples, syntax, algorithms',
        'academic': 'Educational Content - Academic subjects, research-based knowledge',
        'skills': 'Personal Development - Soft skills, communication, leadership',
        'business_finance': 'Business/Finance - Investing, accounting, business strategy',
        'creative': 'Creative Arts - Writing, design, media production',
        'entrepreneurship': 'Business Strategy - Startups, marketing, business models',
        'general': 'Adaptive Content - General topics, fallback prompt'
    }
    return descriptions.get(category, 'Unknown category')

def get_expected_content_type(category):
    """Return expected content characteristics for the category"""
    content_types = {
        'technical': 'Code blocks, technical concepts, implementation details',
        'academic': 'Research-based content, academic explanations, historical context',
        'skills': 'Practical tips, real-life applications, behavioral guidance',
        'business_finance': 'Financial concepts, business examples, practical applications',
        'creative': 'Creative techniques, artistic principles, production guidance',
        'entrepreneurship': 'Business strategies, market insights, startup advice',
        'general': 'Adaptive to topic nature, flexible structure'
    }
    return content_types.get(category, 'Unknown content type')

def test_ai_classification_console():
    """
    Test function to verify AI classification in console
    Run this in Django shell: python manage.py shell
    Then: from backend.ai.reading import test_ai_classification_console; test_ai_classification_console()
    """
    test_topics = [
        "Regular Expressions",
        "React Hooks", 
        "Python Machine Learning",
        "JavaScript Promises",
        "World War 2",
        "Quantum Physics",
        "Public Speaking",
        "Leadership Skills",
        "Stock Market Investing",
        "Personal Finance",
        "Photography Techniques",
        "Creative Writing",
        "Startup Strategy",
        "Business Plan",
        "Machine Learning for Marketing",  # Edge case
        "Financial Modeling in Python",   # Edge case
    ]
    
    print(f"\n{'='*80}")
    print(f"🧪 AI CLASSIFICATION CONSOLE TEST")
    print(f"{'='*80}")
    
    for i, topic in enumerate(test_topics, 1):
        print(f"\n🔬 TEST {i}: '{topic}'")
        print(f"{'─'*50}")
        
        # Test AI classification
        category = classify_topic_with_ai(topic)
        
        # Get prompt info (without full prompt)
        print(f"📝 Selecting prompt for category: '{category}' and topic: '{topic}'")
        
        if category == 'technical':
            print(f"🔧 Using TECHNICAL prompt for topic: '{topic}'")
            print(f"🎯 PROMPT IDENTIFIER: TECHNICAL_PROMPT_V2024 - Programming/Development Focus")
        elif category == 'academic':
            print(f"📚 Using ACADEMIC prompt for topic: '{topic}'")
            print(f"🎯 PROMPT IDENTIFIER: ACADEMIC_PROMPT_V2024 - Educational Content")
        elif category == 'skills':
            print(f"💪 Using SKILLS prompt for topic: '{topic}'")
            print(f"🎯 PROMPT IDENTIFIER: SKILLS_PROMPT_V2024 - Personal Development")
        elif category == 'business_finance':
            print(f"💰 Using BUSINESS_FINANCE prompt for topic: '{topic}'")
            print(f"🎯 PROMPT IDENTIFIER: BUSINESS_FINANCE_V2024 - Finance/Business")
        elif category == 'creative':
            print(f"🎨 Using CREATIVE prompt for topic: '{topic}'")
            print(f"🎯 PROMPT IDENTIFIER: CREATIVE_PROMPT_V2024 - Arts/Media")
        elif category == 'entrepreneurship':
            print(f"🚀 Using ENTREPRENEURSHIP prompt for topic: '{topic}'")
            print(f"🎯 PROMPT IDENTIFIER: ENTREPRENEURSHIP_V2024 - Business Strategy")
        else:
            print(f"❓ Using GENERAL (fallback) prompt for topic: '{topic}'")
            print(f"🎯 PROMPT IDENTIFIER: GENERAL_FALLBACK_V2024 - Adaptive Content")
            
        print(f"✅ Classification complete for: '{topic}' → '{category.upper()}'")
        
        # Brief pause for readability
        import time
        time.sleep(0.5)
    
    print(f"\n{'='*80}")
    print(f"🎉 All {len(test_topics)} tests completed!")
    print(f"{'='*80}")

# Quick single topic test function
def test_single_topic(topic):
    """
    Test a single topic classification
    Usage: from backend.ai.reading import test_single_topic; test_single_topic("Your Topic")
    """
    print(f"\n{'='*60}")
    print(f"🔬 SINGLE TOPIC TEST: '{topic}'")
    print(f"{'='*60}")
    
    category = classify_topic_with_ai(topic)
    
    print(f"🎯 FINAL RESULT: '{topic}' → '{category.upper()}'")
    print(f"{'='*60}\n")
    
    return category 