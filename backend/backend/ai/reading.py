from django.http import JsonResponse
from django.conf import settings
import json
import re
from .ai_service import call_gemini_api, call_gemini_flash_api

def classify_topic_with_ai(topic):
    """
    Use Gemini 2.5 Flash (fallback 2.0 Flash) to intelligently classify topic and select best prompt.
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
        print(f"🎯 Sending topic analysis request to Gemini 2.5 Flash (fallback 2.0 Flash)...")
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

                # Math-first override: force academic for clear math topics
                math_terms = re.compile(r"\b(algebra|calculus|trigonometry|geometry|differential\s+equations?|equations?|derivatives?|integrals?|limits?|matrix|matrices|linear\s+algebra|probability|statistics?)\b", re.IGNORECASE)
                if math_terms.search(topic) and category != 'academic':
                    print(f"📚 Overriding AI category '{category}' → 'academic' for math-related topic")
                    category = 'academic'

                # Validate the category
                valid_categories = ['technical', 'academic', 'skills', 'business_finance', 'creative', 'entrepreneurship', 'general']
                if category in valid_categories:
                    print(f"✅ AI classified '{topic}' as: {category}")
                    return category
                else:
                    print(f"⚠️ AI returned invalid category '{category}', falling back to keyword classification")
                    return classify_topic(topic)

        print("❌ Invalid or empty response from Gemini Flash model, falling back to keyword classification")
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
        'hypothesis', 'experiment', 'analysis', 'statistics', 'probability',
        # Math-heavy topics we always want as academic
        'algebra', 'calculus', 'trigonometry', 'geometry', 'equation', 'equations',
        'differential equations', 'derivative', 'derivatives', 'integral', 'integrals',
        'limit', 'limits', 'matrix', 'matrices', 'linear algebra'
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

def get_prompt_by_category(topic, category, personalization: str | None = None, topic_context: str | None = None):
    """
    Return the appropriate prompt based on topic category
    """
    print(f"📝 Selecting prompt for category: '{category}' and topic: '{topic}'")

    # Normalize personalization block for prompt injection (topic-specific context intentionally not used)
    pers_block = (
        f"\n\n👤 Learner Personalization Cues (apply tone, examples, depth accordingly):\n- {personalization.strip()}\n"
        if isinstance(personalization, str) and personalization.strip()
        else "\n"
    )
    # Note: topic_context is intentionally ignored as per product requirement

    if category == 'technical':
        print(f"🔧 Using TECHNICAL prompt for topic: '{topic}'")
        print(f"🎯 PROMPT IDENTIFIER: TECHNICAL_PROMPT_V2024 - Programming/Development Focus")
        return f"""You are an expert software engineering instructor and technical mentor. Generate comprehensive, professional educational content on **technical topics** including programming concepts, software development practices, frameworks, system design, and computer science fundamentals.

Your task is to create a detailed **Reading Section** using **Markdown syntax** that serves as a complete learning resource for developers, from beginners to intermediate level.

{pers_block}

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
            print(f"✅ Using UNIVERSAL & COMPATIBLE prompt for topic: '{topic}'")
            return f"""You are a dynamic AI curriculum designer and expert educator. Your purpose is not to follow a template, but to create the most effective and personalized learning module possible for a user's specific platform.

Your primary, non-negotiable mission is to generate a bespoke learning experience based **entirely** on the user's personalization request below. You must deeply internalize their learning style, level, and goals, and let that dictate the structure, tone, and content of your response.

{pers_block}

---

### Core Directives & Guiding Principles:

**1. Break the Mold (Embrace Adaptability):**
- **Do NOT use a fixed, static set of Markdown headers.**
- **Dynamically choose the most effective structure** and section headers based on the subject matter and the user's unique learning needs. A lesson on History will look very different from a lesson on Algebra.

**2. Principles of an Exceptional Lesson (These must be included, but in your own structure):**
- **A Captivating Hook:** Start by explaining why the topic is fascinating or critically important, tailored to the user's perspective.
- **Foundational Concepts:** Clearly and simply explain the absolute basics before building on them.
- **The Core Subject Matter:** This is the heart of the lesson. Explain the key principles, theories, or mechanisms.
- **Concrete Application:** Show the concepts in action with clear examples or case studies.
- **An Illuminating Visual or Analogy:** Provide a text-based diagram, a powerful analogy, or a descriptive visual to aid understanding. Use simple Markdown lists or blockquotes for diagrams.

**3. CRITICAL Formatting Rules for Math & Code (Universal Compatibility):**
- **Do NOT use LaTeX.** Avoid `$ ... $` and `$$ ... $$` syntax completely.
- **Do NOT use triple backtick code fences (```) in academic content.** These render as large code panels in the UI.
- **For inline math and variables** (like x, 5, or a specific term), wrap in **single backticks**.
    - Example: "To find the value of `x`, we need to..."
- **For multi-line equations**, write each equation on its own line using simple symbols (`*` for multiply, `/` for divide`). Present them as bullet points or blockquotes without code fences.
    - Example:
        - `12 * p = 60`
        - `(12 * p) / 12 = 60 / 12`
        - `p = 5`
- For text-based diagrams, prefer blockquotes:
    > Distance-Time Graph (conceptual):
    > start → steady speed → stop

**4. General Formatting for Clarity:**
- Use Markdown effectively: `**bold**` for key terms, bullet points for lists, and descriptive headers that you invent for the specific topic.
- Keep paragraphs focused and digestible.

🚫 **Do NOT include**:
- A final "Summary" or "Conclusion" section.
- A quiz, practice questions, or homework assignments.
- External links or source citations.

---

## INPUT FORMAT:
{topic}

## OUTPUT FORMAT:
Return the content **only in Markdown format**. Invent your own logical structure and headers that best serve the topic and the user's personalization request, while strictly following the universal compatibility rules (no code fences; use inline backticks for math).
"""
    elif category == 'skills':
        print(f"💪 Using SKILLS prompt for topic: '{topic}'")
        return f"""You are a professional coach and educator skilled in teaching **soft skills and personal development topics** like communication, confidence, time management, emotional intelligence, leadership, etc.

Given a topic by the user, generate a clear and structured **Reading Section** in **Markdown format** that helps individuals learn and grow in this area—whether for career, personal life, or relationships.

{pers_block}

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

{pers_block}

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

{pers_block}

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

{pers_block}

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
        topic = body.get('topic', '').strip()
        # Only personalization is applied; topic-specific context is intentionally ignored
        personalization = body.get('personalization')
        topic_context = None

        print(f"\n{'='*60}")
        print("🚀 STARTING AI PROMPT SELECTION PROCESS")
        print(f"{'='*60}")
        print(f"📥 Input Topic: '{topic}'")
        print("🤖 Method: AI-Powered Classification (Primary) + Keyword Fallback (Backup)")
        # Debug: log personalization received (topic_context is intentionally ignored)
        try:
            pers_preview = (personalization or "").strip()
            if len(pers_preview) > 140:
                pers_preview = pers_preview[:140] + "..."
            print("----- PERSONALIZATION DEBUG BEGIN -----")
            print(f"👤 Personalization received: '{pers_preview if pers_preview else 'None'}'")
            print("----- PERSONALIZATION DEBUG END -----")
        except Exception:
            print("👤 Personalization received: <unprintable or None>")

        # Classify the topic using AI and get appropriate prompt
        category = classify_topic_with_ai(topic)

        print(f"🎯 FINAL CATEGORY SELECTED: '{category.upper()}'")

        # Get the appropriate prompt with personalization only
        prompt = get_prompt_by_category(topic, category, personalization=personalization, topic_context=topic_context)

        print("🧩 ACTUAL PROMPT BEING USED:")
        print(f"{'='*40}")
        print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
        print(f"{'='*40}")

        print(f"📤 Sending to Gemini API with {category.upper()} prompt...")
        print(f"{'='*60}")

        result = call_gemini_api(prompt)

        print("✅ Content generated successfully!")

        # Analyze if the response matches the expected prompt format
        if isinstance(result, dict):
            if 'content' in result and isinstance(result['content'], str):
                content_text = result['content']
            elif 'candidates' in result:
                # Extract first candidate text
                try:
                    candidates = result.get('candidates') or []
                    candidate0 = candidates[0] if candidates else {}
                    parts = (
                        candidate0.get('content', {}).get('parts')
                        if isinstance(candidate0.get('content'), dict)
                        else None
                    )
                    text = None
                    if isinstance(parts, list) and parts:
                        first = parts[0]
                        if isinstance(first, dict):
                            text = first.get('text')
                    if not isinstance(text, str) or not text.strip():
                        text = candidate0.get('text') if isinstance(candidate0, dict) else None
                    content_text = text if isinstance(text, str) else ""
                except Exception:
                    content_text = ""
                # Normalize result to minimal shape expected by frontend
                result = {'content': content_text}
            else:
                # Unknown dict shape; stringify content for safety and normalize
                content_text = str(result)
                result = {'content': content_text}
        elif isinstance(result, str):
            content_text = result
            result = {'content': content_text}
        else:
            content_text = str(result)
            result = {'content': content_text}

        # Sanitize any accidental code-fenced blocks that are not real code (applies to all categories)
        def sanitize_markdown_fences(text: str, category_hint: str):
            """
            Convert bare triple-backtick blocks without a language tag (or with non-code tags like 'text', 'math')
            into inline code, bullets, or blockquotes so they don't render as giant code panels.
            Preserve fenced blocks that declare a programming language (e.g., ```python) or contain code keywords.
            Returns (sanitized_text, replacements)
            """
            if not isinstance(text, str) or '```' not in text:
                return text, 0

            # Regex to find fenced blocks: ```[lang?]\n...\n```
            fence_pattern = re.compile(r"```([a-zA-Z0-9_+\-]*)\n([\s\S]*?)\n```", re.MULTILINE)

            code_keywords = re.compile(r"\b(def |class |function |var |let |const |import |public |private |return |for |while |if\s*\(|else|elif|=>|#include|using namespace|printf\(|System\.out\.println|console\.log)\b", re.IGNORECASE)
            # Languages considered real code — keep as code blocks
            real_code_langs = {"python","py","javascript","js","typescript","ts","java","c","cpp","c++","c#","cs","go","rust","rb","ruby","swift","kotlin","php","r","matlab","octave","bash","sh","shell","powershell","ps1","sql","html","xml","json","yaml","yml","toml","css","scss","less"}
            # Languages that are not really code in this UI — convert
            non_code_langs = {"", "text", "plain", "plaintext", "markdown", "md", "math", "equation", "equations"}

            replacements = 0
            def _replace(m):
                nonlocal replacements
                lang = (m.group(1) or '').strip()
                body = m.group(2)
                # Keep if language specified and is a real programming language
                if lang and (lang.lower() in real_code_langs):
                    return m.group(0)
                # Keep if likely programming code by keywords
                if code_keywords.search(body):
                    return m.group(0)
                # Otherwise transform intelligently
                replacements += 1
                lines = [ln.rstrip() for ln in body.splitlines() if ln.strip()]
                mathish = re.compile(r"^[A-Za-z0-9_().,+\-*/=^% \\]+$")
                # Case 1: Single short token like "p" or "t" → inline LaTeX math
                if len(lines) == 1 and len(lines[0]) <= 8 and ' ' not in lines[0] and mathish.match(lines[0]):
                    return f"${lines[0]}$"
                # Case 2: Very short math lines (<= 40 chars) → bullet list with inline LaTeX math
                if lines and all(len(l) <= 40 and mathish.match(l) for l in lines) and not any(c in '\t' for c in body):
                    bullets = '\n'.join([f"- ${l}$" for l in lines])
                    return bullets
                # Fallback: blockquote for larger text blocks
                quoted = '\n'.join(["> " + line if line.strip() else ">" for line in body.splitlines()])
                return quoted

            new_text = fence_pattern.sub(_replace, text)
            return new_text, replacements

        def convert_inline_code_math(text: str):
            """Replace short inline code `...` that looks like math tokens with LaTeX $...$.
            Returns (text, replacements)
            """
            if not isinstance(text, str) or '`' not in text:
                return text, 0
            pattern = re.compile(r"`([^`\n]{1,30})`")
            codeish = re.compile(r"(def\s|class\s|;|\{|\}|<|>|console\.|System\.|import\s|function\s|return\s)")
            mathish = re.compile(r"^[A-Za-z0-9_().,+\-*/=^% \\]+$")
            reps = 0
            def _repl(m):
                nonlocal reps
                s = m.group(1).strip()
                if len(s) <= 30 and mathish.match(s) and not codeish.search(s):
                    reps += 1
                    return f"${s}$"
                return m.group(0)
            out = pattern.sub(_repl, text)
            return out, reps

        def sanitize_indented_code_blocks(text: str):
            """Detect indented code blocks (4+ spaces or a tab) that contain short math-ish lines
            and convert them to inline math ($...$) or bullet lists. Returns (text, replacements).
            """
            if not isinstance(text, str):
                return text, 0
            lines = text.splitlines()
            out = []
            i = 0
            reps = 0
            mathish = re.compile(r"^[A-Za-z0-9_().,+\-*/=^% \\]+$")
            while i < len(lines):
                line = lines[i]
                # Start of an indented block
                if (line.startswith('    ') or line.startswith('\t')):
                    block = []
                    # Collect consecutive indented lines
                    while i < len(lines) and (lines[i].startswith('    ') or lines[i].startswith('\t')):
                        block.append(lines[i].lstrip(' \t'))
                        i += 1
                    trimmed = [b for b in block if b.strip()]
                    if trimmed and all(len(b) <= 40 and mathish.match(b) for b in trimmed):
                        reps += 1
                        if len(trimmed) == 1 and ' ' not in trimmed[0] and len(trimmed[0]) <= 12:
                            out.append(f"${trimmed[0]}$")
                        else:
                            out.extend([f"- ${b}$" for b in trimmed])
                    else:
                        # Not math-ish, keep as-is (reconstruct with same indentation)
                        out.extend(['    ' + b for b in block])
                    continue
                else:
                    out.append(line)
                    i += 1
            return "\n".join(out), reps

        def ensure_academic_headers(text: str, topic_title: str):
            """
            Ensure the academic content has visible Markdown headings:
            - Prepend a top-level H2 with the topic if no '## ' exists.
            - Upgrade title-like lines (Capitalized words possibly ending with a colon) to H3.
            """
            if not isinstance(text, str) or not text.strip():
                return text
            lines = text.splitlines()
            has_h2 = any(line.strip().startswith("## ") for line in lines)
            out = []
            inserted_h2 = False
            if not has_h2:
                out.append(f"## {topic_title}: Learning Guide")
                out.append("")
                inserted_h2 = True
            heading_like = re.compile(r"^([A-Z][\w\s,&'-]{3,80}?)(:)?\s*$")
            for idx, line in enumerate(lines):
                s = line.rstrip()
                if s and not s.startswith(("#", "- ", "* ", ">", "`", "1. ", "2. ", "3. ")) and heading_like.match(s) and len(s.split()) <= 10:
                    out.append("### " + s.lstrip("# "))
                else:
                    out.append(line)
            result_text = "\n".join(out)
            return result_text
            
        print(f"🔍 RESPONSE ANALYSIS:")
        print(f"   • Content length: {len(content_text)} characters")

        # Universal sanitization pass for non-code fences
        markdown_replacements = 0
        sanitized_text, rep = sanitize_markdown_fences(content_text, category)
        markdown_replacements = rep
        if rep > 0:
            print(f"   • Markdown sanitizer converted {rep} non-code fenced block(s)")
            content_text = sanitized_text
            if isinstance(result, dict) and 'content' in result:
                result['content'] = content_text
            else:
                result = {'content': content_text}

        # Convert remaining short inline code to LaTeX inline math
        inline_math_text, inline_rep = convert_inline_code_math(content_text)
        if inline_rep > 0:
            print(f"   • Inline code → math converted: {inline_rep} token(s)")
            content_text = inline_math_text
            if isinstance(result, dict) and 'content' in result:
                result['content'] = content_text
            else:
                result = {'content': content_text}

        # Convert indented code blocks (4-space/tab) that are math-ish
        indent_text, indent_rep = sanitize_indented_code_blocks(content_text)
        if indent_rep > 0:
            print(f"   • Indented code → math converted: {indent_rep} block(s)")
            content_text = indent_text
            if isinstance(result, dict) and 'content' in result:
                result['content'] = content_text
            else:
                result = {'content': content_text}

        # Academic headings normalization
        academic_sanitized = rep > 0 if category == 'academic' else False
        academic_replacements = rep if category == 'academic' else 0
        if category == 'academic':
            normalized_text = ensure_academic_headers(content_text, topic)
            if normalized_text != content_text:
                content_text = normalized_text
                if isinstance(result, dict) and 'content' in result:
                    result['content'] = content_text
                else:
                    result = {'content': content_text}
        
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
                'expected_content_type': get_expected_content_type(category),
                'personalization_applied': bool(personalization),
                'topic_context_applied': False
            }
            result['applied_personalization'] = personalization
            result['applied_topic_context'] = None
            result['backend_analysis'] = {
                'content_length': len(content_text),
                'word_count_estimate': len(content_text.split()),
                'technical_indicators_found': len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) if category == 'technical' else None,
                'verification_status': 'passed' if category != 'technical' or len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) >= 2 else 'warning',
                'markdown_sanitized': markdown_replacements > 0,
                'markdown_replacement_blocks': markdown_replacements,
                'inline_math_converted_tokens': inline_rep,
                'indented_math_converted_blocks': indent_rep,
                'academic_sanitized': academic_sanitized if category == 'academic' else None,
                'academic_replacement_blocks': academic_replacements if category == 'academic' else None
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
                    'expected_content_type': get_expected_content_type(category),
                    'personalization_applied': bool(personalization),
                    'topic_context_applied': False
                },
                'applied_personalization': personalization,
                'applied_topic_context': None,
                'backend_analysis': {
                    'content_length': len(content_text),
                    'word_count_estimate': len(content_text.split()),
                    'technical_indicators_found': len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) if category == 'technical' else None,
                    'verification_status': 'passed' if category != 'technical' or len([indicator for indicator in ['code', 'programming', 'Code Examples', '```', 'algorithm', 'syntax', 'function'] if indicator.lower() in content_text.lower()]) >= 2 else 'warning',
                    'markdown_sanitized': markdown_replacements > 0,
                    'markdown_replacement_blocks': markdown_replacements,
                    'inline_math_converted_tokens': inline_rep,
                    'indented_math_converted_blocks': indent_rep,
                    'academic_sanitized': academic_sanitized if category == 'academic' else None,
                    'academic_replacement_blocks': academic_replacements if category == 'academic' else None
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