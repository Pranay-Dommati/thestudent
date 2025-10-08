from django.http import JsonResponse
from django.conf import settings
import json
import re
from .ai_service import call_gemini_api, call_gemini_flash_api, NetworkError
from datetime import datetime
from .sanitization import sanitize_ai_content

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
    print(f"📝 TOPIC VALUE RECEIVED IN get_prompt_by_category: '{topic}' (length: {len(topic)})")
    print(f"📝 Will inject topic into prompt template at 'INPUT FORMAT' section")

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
        return f"""You are an expert software engineering instructor and technical mentor. 

🚨 CRITICAL INSTRUCTION: You MUST create educational content ONLY about the specific topic provided below. Do NOT write about any other topic.

TOPIC YOU MUST WRITE ABOUT: **{topic}**

Your task is to create a detailed **Reading Section** using **Markdown syntax** about **{topic}** that serves as a complete learning resource for developers, from beginners to intermediate level.

{pers_block}

🎯 **Tone & Style Guidelines**:
- Professional yet accessible - like a senior developer explaining to a junior colleague
- Clear, precise technical language without unnecessary jargon
- Use technical analogies only when they genuinely clarify complex concepts
- Focus on practical understanding and real-world application
- Maintain educational authority while being approachable

📘 **Content Must Include** (ALL about **{topic}**):
- ✅ **Technical Definition**: Clear, accurate explanation of what **{topic}** is
- ✅ **Core Sections** using these Markdown headers:
  - `## Introduction` (introduce **{topic}**)
  - `## Why it Matters` (why **{topic}** is important in software development)
  - `## How it Works` (technical mechanics of **{topic}**)
  - `## Key Concepts` (important terminology and principles related to **{topic}**)
  - `## Code Examples` (practical examples demonstrating **{topic}** with explanations)
  - `## Common Use Cases` (where and when to use **{topic}**)
  - `## Best Practices` (industry-standard approaches for **{topic}**)
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

🚫 **ABSOLUTELY AVOID**:
- Writing about ANY topic other than **{topic}**
- Overly casual analogies that trivialize the topic
- Summary sections
- Quiz questions
- External links or references
- Buzzwords without substance

---

🎯 REMINDER: Generate content EXCLUSIVELY about **{topic}**. Start your response with `## Introduction` and focus entirely on **{topic}**.

## OUTPUT FORMAT:
Return the content **only in Markdown format**, beginning directly with `## Introduction` about **{topic}** and continuing with the specified sections all focused on **{topic}**."""

    elif category == 'academic':
            print(f"✅ Using UNIVERSAL & COMPATIBLE prompt for topic: '{topic}'")
            return f"""You are a dynamic AI curriculum designer and expert educator.

🚨 CRITICAL INSTRUCTION: You MUST create educational content ONLY about the specific topic provided below. Do NOT write about any other topic.

TOPIC YOU MUST WRITE ABOUT: **{topic}**

Your task is to create the most effective and personalized learning module about **{topic}** for a user's specific platform.

{pers_block}

---

### Core Directives & Guiding Principles:

**1. Break the Mold (Embrace Adaptability):**
- **Do NOT use a fixed, static set of Markdown headers.**
- **Dynamically choose the most effective structure** and section headers based on **{topic}** and the user's unique learning needs. A lesson on History will look very different from a lesson on Algebra.

**2. Principles of an Exceptional Lesson about **{topic}** (These must be included, but in your own structure):**
- **A Captivating Hook:** Start by explaining why **{topic}** is fascinating or critically important, tailored to the user's perspective.
- **Foundational Concepts:** Clearly and simply explain the absolute basics of **{topic}** before building on them.
- **The Core Subject Matter:** This is the heart of the lesson. Explain the key principles, theories, or mechanisms of **{topic}**.
- **Concrete Application:** Show **{topic}** concepts in action with clear examples or case studies.
- **An Illuminating Visual or Analogy:** Provide a text-based diagram, a powerful analogy, or a descriptive visual to aid understanding of **{topic}**. Use simple Markdown lists or blockquotes for diagrams.

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
- Use Markdown effectively: `**bold**` for key terms, bullet points for lists, and descriptive headers that you invent for **{topic}**.
- Keep paragraphs focused and digestible.

🚫 **ABSOLUTELY AVOID**:
- Writing about ANY topic other than **{topic}**
- A final "Summary" or "Conclusion" section
- A quiz, practice questions, or homework assignments
- External links or source citations

---

🎯 REMINDER: Generate content EXCLUSIVELY about **{topic}**. Every section, example, and explanation must be about **{topic}**.

## OUTPUT FORMAT:
Return the content **only in Markdown format**. Invent your own logical structure and headers that best serve **{topic}** and the user's personalization request, while strictly following the universal compatibility rules (no code fences; use inline backticks for math).
"""
    elif category == 'skills':
        print(f"💪 Using SKILLS prompt for topic: '{topic}'")
        return f"""You are a professional coach and educator skilled in teaching soft skills and personal development topics.

🚨 CRITICAL INSTRUCTION: You MUST create educational content ONLY about the specific topic provided below. Do NOT write about any other topic.

TOPIC YOU MUST WRITE ABOUT: **{topic}**

Your task is to generate a clear and structured **Reading Section** in **Markdown format** about **{topic}** that helps individuals learn and grow in this area—whether for career, personal life, or relationships.

{pers_block}

🎯 **Tone & Style Guidelines**:
- Friendly, motivational, and practical.
- Easy to understand for beginners.
- Include real-life applications wherever possible.

📘 **Content Must Include** (ALL about **{topic}**):
- ✅ Explanation of **{topic}** with depth
- ✅ Organize content using these Markdown headers:
  - `## Introduction` (introduce **{topic}**)
  - `## Why It Matters` (why **{topic}** is important)
  - `## Core Principles or Techniques` (key concepts of **{topic}**)
  - `## Real-Life Applications` (how to apply **{topic}**)
  - `## Common Mistakes` (mistakes to avoid with **{topic}**)
  - `## Practical Tips or Exercises` (actionable advice for **{topic}**)
  - `## Inspirational Examples` *(optional, real-world examples of **{topic}**)*

- ✅ Use formatting:
  - `**bold**` for key terms
  - Bullet points for strategies and lists
  - Use direct, actionable language
  - Avoid fluff and vague ideas

🚫 **ABSOLUTELY AVOID**:
- Writing about ANY topic other than **{topic}**
- Summary
- Quiz
- Links to sources

---

🎯 REMINDER: Generate content EXCLUSIVELY about **{topic}**. Start with `## Introduction` about **{topic}**.

## OUTPUT FORMAT:
Return the content **only in Markdown format**, beginning directly with `## Introduction` about **{topic}** and continuing with the sections listed above."""

    elif category == 'business_finance':
        print(f"💰 Using BUSINESS_FINANCE prompt for topic: '{topic}'")
        return f"""You are an expert AI tutor designed to generate complete, clear, and deeply engaging educational content on business and finance topics.

🚨 CRITICAL INSTRUCTION: You MUST create educational content ONLY about the specific topic provided below. Do NOT write about any other topic.

TOPIC YOU MUST WRITE ABOUT: **{topic}**

Your task is to generate a full *Reading Section* about **{topic}** that feels like a high-quality self-paced learning resource for students, early professionals, founders, and finance enthusiasts.

{pers_block}

✅ Guidelines to follow (ALL about **{topic}**):

- Explain the **fundamentals** of **{topic}**: What it is, why it matters, and its relevance in real-world business or finance contexts.
- Include sections about **{topic}** like **strategies, frameworks, examples**, and if applicable, **simple calculations or models**.
- Use a **clear, semi-formal tone** — professional but friendly — like a mentor explaining **{topic}** to a motivated learner.
- Break content using visual structure: subheadings (`##`, `###`), bullet points, numbered lists, callouts, and bold keywords.
- Relate **{topic}** to **real-world examples** like companies, case studies, market scenarios, or personal finance cases.
- Avoid robotic definitions. Focus on **storytelling, intuition, and clarity** about **{topic}**.
- You may include simplified **formulas or charts (as markdown)** where needed, to enhance clarity of **{topic}**.
- Do **not generate a quiz, summary, or external resources** — only the *reading section* about **{topic}**.

🚫 **ABSOLUTELY AVOID**:
- Writing about ANY topic other than **{topic}**
- Quiz, summary, or external resources

---

🎯 REMINDER: Generate content EXCLUSIVELY about **{topic}**. Every section must focus on **{topic}**.

## OUTPUT FORMAT:
Start directly with the markdown content about **{topic}**, using a format like:

- Introduction to **{topic}**
- Real-World Importance of **{topic}**
- How **{topic}** Works / Core Concepts  
- Frameworks or Techniques for **{topic}**
- Practical Examples or Case Studies of **{topic}**
- Tips, Mistakes to Avoid, or Best Practices for **{topic}**"""

    elif category == 'creative':
        print(f"🎨 Using CREATIVE prompt for topic: '{topic}'")
        return f"""You are a creative mentor AI that helps learners master topics related to creative arts, writing, storytelling, filmmaking, design, photography, content creation, and media production.

🚨 CRITICAL INSTRUCTION: You MUST create educational content ONLY about the specific topic provided below. Do NOT write about any other topic.

TOPIC YOU MUST WRITE ABOUT: **{topic}**

Your job is to generate a *Reading Section* about **{topic}** that feels like a personal guide from a creative industry expert — full of insight, examples, and inspiration.

{pers_block}

✅ Guidelines to follow (ALL about **{topic}**):

- Start with a **motivating introduction** that captures the soul of **{topic}**.
- Offer **conceptual clarity + practical insights** about **{topic}** — help learners understand both the *art and craft* behind **{topic}**.
- Include techniques, frameworks, and tips for **{topic}** followed by real creators or used in the industry.
- Use a friendly, inspiring tone — like a mentor guiding a passionate beginner through **{topic}**.
- Structure the content in markdown: use `##` for sections, **bold** for emphasis, bullet points, numbered steps.
- Add **mini case studies, analogies, creative challenges, or examples** from books, films, or art related to **{topic}** if possible.
- Balance emotion with technique — speak to the heart *and* the hands of the learner about **{topic}**.
- Don't include summary, quiz, or further reading links — this is *only* the reading module about **{topic}**.

🚫 **ABSOLUTELY AVOID**:
- Writing about ANY topic other than **{topic}**
- Summary, quiz, or further reading links

---

🎯 REMINDER: Generate content EXCLUSIVELY about **{topic}**. Make the learner *feel* like they're stepping into a world of imagination with structure.

## OUTPUT FORMAT:
Start with markdown output about **{topic}** like this:

- Introduction to **{topic}**
- Why **{topic}** is Powerful or Important  
- Core Techniques / Creative Principles of **{topic}**
- Real-Life Creative Process Examples using **{topic}**
- Challenges & Practice Advice for **{topic}**
- Tips from Artists or Creators about **{topic}**
- Common Blocks with **{topic}** and How to Overcome Them"""

    elif category == 'entrepreneurship':
        print(f"🚀 Using ENTREPRENEURSHIP prompt for topic: '{topic}'")
        print(f"🎯 PROMPT IDENTIFIER: ENTREPRENEURSHIP_V2024 - Business Strategy")
        return f"""You are an expert business mentor and entrepreneurship educator specializing in startups, business strategy, marketing, venture capital, business models, and entrepreneurship fundamentals.

🚨 CRITICAL INSTRUCTION: You MUST create educational content ONLY about the specific topic provided below. Do NOT write about any other topic.

TOPIC YOU MUST WRITE ABOUT: **{topic}**

Your task is to create a comprehensive **Reading Section** using **Markdown syntax** about **{topic}** that serves as a complete learning resource for aspiring entrepreneurs and business professionals.

{pers_block}

🎯 **Tone & Style Guidelines**:
- Professional yet inspiring - like a successful entrepreneur sharing wisdom about **{topic}**
- Use business terminology appropriately while remaining accessible
- Focus on practical application and real-world business insights about **{topic}**
- Include concrete examples from successful companies and startups
- Maintain entrepreneurial energy while being educational

📈 **Content Must Include** (ALL about **{topic}**):
- ✅ **Business Context**: Why **{topic}** matters in entrepreneurship and business
- ✅ **Core Sections** using these Markdown headers:
  - `## Introduction` (introduce **{topic}**)
  - `## Real-World Relevance` (market impact and business importance of **{topic}**)
  - `## Core Concepts and Frameworks` (key business principles and models related to **{topic}**)
  - `## Case Study or Analogy` (real company examples of **{topic}** or business analogies)
  - `## Application Steps` (practical implementation guidance for **{topic}**)
  - `## Industry Insights / Expert Tips` (professional advice about **{topic}**)
  - `## Pitfalls to Avoid` (common mistakes with **{topic}** and how to prevent them)
- ✅ **Business Examples**:
  - Use real companies and startups as examples of **{topic}** (Google, Tesla, Airbnb, etc.)
  - Include relevant business metrics and outcomes when possible
  - Show both successful implementations and lessons from failures with **{topic}**
- ✅ **Formatting**:
  - `**bold**` for key business terms and concepts
  - Bullet points for strategies, features, and benefits
  - Numbered steps for processes and implementation plans
  - Professional tone throughout

🚫 **ABSOLUTELY AVOID**:
- Writing about ANY topic other than **{topic}**
- Overly casual language that undermines business credibility
- Generic advice without specific business context
- Theoretical concepts without practical application
- Missing any of the required markdown headers

---

🎯 REMINDER: Generate content EXCLUSIVELY about **{topic}**. Start with `## Introduction` about **{topic}**.

Generate comprehensive, professionally-formatted content about **{topic}** that helps readers understand both the concept and its practical business application."""

    else:  # general/fallback
        print(f"❓ Using GENERAL (fallback) prompt for topic: '{topic}'")
        print(f"🎯 PROMPT IDENTIFIER: GENERAL_FALLBACK_V2024 - Adaptive Content")
        return f"""You are a world-class educator and expert communicator.

🚨 CRITICAL INSTRUCTION: You MUST create educational content ONLY about the specific topic provided below. Do NOT write about any other topic.

TOPIC YOU MUST WRITE ABOUT: **{topic}**

Your task is to generate a **deep, clear, and adaptive markdown learning guide** EXCLUSIVELY about **{topic}**.

Your job is to teach **{topic}** like a personal tutor. The learner should fully understand **{topic}** just by reading this — no other websites, videos, or resources needed.

Adapt your style based on **{topic}**:
- If **{topic}** is **technical**, include clean code blocks, syntax, walkthroughs, real examples.
- If **{topic}** is **non-technical**, focus on intuitive breakdowns, visuals (via analogy), examples, and real-life connections.
- Don't force irrelevant sections — adapt naturally to what **{topic}** needs.

 **ABSOLUTELY AVOID**:
- Writing about ANY topic other than **{topic}**
- Irrelevant content

---

🎯 REMINDER: Generate content EXCLUSIVELY about **{topic}**. Be comprehensive but concise. Every section must focus on **{topic}**.

Generate only the markdown content about **{topic}**."""

def handle_reading(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        body = json.loads(request.body.decode('utf-8'))
        topic = body.get('topic', '').strip()
        # Only personalization is applied; topic-specific context is intentionally ignored
        personalization = body.get('personalization')
        topic_context = None
        debug_requested = bool(body.get('debug'))

        print(f"\n{'='*60}")
        print("🚀 STARTING AI PROMPT SELECTION PROCESS")
        print(f"{'='*60}")
        print(f"📥 RAW REQUEST BODY: {body}")
        print(f"📥 Input Topic EXTRACTED: '{topic}' (type: {type(topic)})")
        print(f"📥 Topic length: {len(topic)} characters")
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
        print(f"🎯 TOPIC BEFORE PROMPT GENERATION: '{topic}'")

        # Get the appropriate prompt with personalization only
        prompt = get_prompt_by_category(topic, category, personalization=personalization, topic_context=topic_context)

        print("🧩 ACTUAL PROMPT BEING USED:")
        print(f"{'='*40}")
        print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
        print(f"{'='*40}")
        # Check if topic appears in the generated prompt
        if topic.lower() in prompt.lower():
            print(f"✅ Topic '{topic}' FOUND in generated prompt")
        else:
            print(f"❌ WARNING: Topic '{topic}' NOT FOUND in generated prompt!")
        print(f"📤 Sending prompt to Gemini API with category: {category.upper()}, topic: '{topic}'...")
        print(f"{'='*60}")

        # ========================================
        # 🚨 CRITICAL DEBUG: FULL PROMPT TO GEMINI
        # ========================================
        print("\n" + "="*80)
        print("🚨 FULL PROMPT BEING SENT TO GEMINI AI")
        print("="*80)
        print(f"📤 TOPIC: '{topic}'")
        print(f"📤 CATEGORY: '{category.upper()}'")
        print(f"📤 PROMPT LENGTH: {len(prompt)} characters")
        print("-"*80)
        print("📤 FULL PROMPT:")
        print("-"*80)
        print(prompt)
        print("-"*80)
        print("="*80 + "\n")

        raw_prompt_for_debug = prompt  # capture before call
        result = call_gemini_api(prompt)
        raw_response_obj = result  # keep original for debug (may mutate later)

        # ========================================
        # 🚨 CRITICAL DEBUG: GEMINI RESPONSE
        # ========================================
        print("\n" + "="*80)
        print("🚨 GEMINI AI RESPONSE RECEIVED")
        print("="*80)
        print(f"📥 TOPIC WAS: '{topic}'")
        print(f"📥 CATEGORY WAS: '{category.upper()}'")
        print(f"📥 RESPONSE TYPE: {type(result)}")
        
        # Extract content preview
        content_preview = ""
        if isinstance(result, dict):
            if 'content' in result:
                content_preview = str(result['content'])[:500]
            elif 'candidates' in result:
                try:
                    candidates = result.get('candidates', [])
                    if candidates:
                        parts = candidates[0].get('content', {}).get('parts', [])
                        if parts:
                            content_preview = str(parts[0].get('text', ''))[:500]
                except:
                    content_preview = str(result)[:500]
        else:
            content_preview = str(result)[:500]
        
        print(f"📥 RESPONSE CONTENT (first 500 chars):")
        print("-"*80)
        print(content_preview)
        print("-"*80)
        print("="*80 + "\n")

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

        # ========================================
        # 🔧 PROFESSIONAL MARKDOWN SANITIZATION ENGINE
        # ========================================
        # This system handles ALL markdown/LaTeX issues BEFORE first render
        # Converts AI output to UI-compatible format using shared sanitization module
        
        print(f"🔍 RESPONSE ANALYSIS:")
        print(f"   • Content length: {len(content_text)} characters")
        
        # Show first 500 chars to see if LaTeX is present
        preview = content_text[:500]
        latex_count_before = preview.count('$')
        backtick_count_before = preview.count('`')
        print(f"   • LaTeX $ symbols in first 500 chars: {latex_count_before}")
        print(f"   • Backticks ` in first 500 chars: {backtick_count_before}")
        if latex_count_before > 0:
            print(f"   ⚠️ WARNING: LaTeX detected in content - will sanitize")

        # ========================================
        # 🚀 APPLY COMPREHENSIVE SANITIZATION PIPELINE
        # ========================================
        # Using shared sanitization module for consistent processing
        
        print(f"   🧹 Starting comprehensive sanitization...")
        content_text, changes = sanitize_ai_content(content_text, category)
        
        if changes['total'] > 0:
            print(f"   ✅ Sanitization complete:")
            print(f"      • LaTeX removed: {changes['latex_removed']}")
            print(f"      • Excessive inline code cleaned: {changes['inline_code_cleaned']}")
            print(f"      • Code fences sanitized: {changes['fences_sanitized']}")
            print(f"      • Indented blocks cleaned: {changes['indents_cleaned']}")
            print(f"      • Total changes: {changes['total']}")
            
            # Verify cleanup
            latex_count_after = content_text[:500].count('$')
            backtick_count_after = content_text[:500].count('`')
            print(f"   • LaTeX $ symbols after cleanup: {latex_count_after}")
            print(f"   • Backticks ` after cleanup: {backtick_count_after}")
        else:
            print(f"   ✅ No sanitization needed - content is clean")
        
        # Update result with sanitized content
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
                'sanitization_applied': changes['total'] > 0,
                'sanitization_changes': changes['total'],
                'latex_removed': changes['latex_removed'],
                'inline_code_cleaned': changes['inline_code_cleaned'],
                'fences_sanitized': changes['fences_sanitized'],
                'indents_cleaned': changes['indents_cleaned']
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
                    'sanitization_applied': changes['total'] > 0,
                    'sanitization_changes': changes['total'],
                    'latex_removed': changes['latex_removed'],
                    'inline_code_cleaned': changes['inline_code_cleaned'],
                    'fences_sanitized': changes['fences_sanitized'],
                    'indents_cleaned': changes['indents_cleaned']
                }
            }
        
        # Inject debug metadata if requested
        if debug_requested and isinstance(result, dict):
            try:
                # CRITICAL: Return FULL prompt to see topic at the end (no truncation)
                # Prompts are typically 2000-3000 chars, we need to see the ## INPUT FORMAT section
                prompt_preview = raw_prompt_for_debug  # Full prompt - no truncation!
                
                # For response, show more but can still truncate (first 2000 chars is enough)
                if isinstance(raw_response_obj, dict):
                    if 'content' in raw_response_obj and isinstance(raw_response_obj['content'], str):
                        raw_resp_text = raw_response_obj['content']
                    elif 'candidates' in raw_response_obj:
                        cand = raw_response_obj.get('candidates') or []
                        raw_resp_text = ''
                        if cand:
                            c0 = cand[0]
                            if isinstance(c0, dict):
                                parts = c0.get('content', {}).get('parts') if isinstance(c0.get('content'), dict) else None
                                if isinstance(parts, list) and parts and isinstance(parts[0], dict):
                                    raw_resp_text = parts[0].get('text', '')
                                else:
                                    raw_resp_text = c0.get('text', '')
                    else:
                        raw_resp_text = str(raw_response_obj)
                else:
                    raw_resp_text = str(raw_response_obj)
                raw_resp_preview = (raw_resp_text[:2000] + '...') if len(raw_resp_text) > 2000 else raw_resp_text
                
                result['__debug'] = {
                    'prompt_topic': topic,
                    'prompt_category': category,
                    'prompt_length': len(raw_prompt_for_debug),
                    'prompt_full': prompt_preview,  # Renamed to make it clear it's the full prompt
                    'prompt_last_200_chars': raw_prompt_for_debug[-200:],  # Show the end explicitly
                    'response_preview': raw_resp_preview,
                    'response_length': len(raw_resp_text) if isinstance(raw_resp_text, str) else None,
                    'ts': datetime.utcnow().isoformat() + 'Z'
                }
            except Exception as _e:  # swallow debug errors
                result['__debug_error'] = str(_e)

        return JsonResponse(result, safe=False)
    except NetworkError as e:
        # Handle network/timeout errors specifically
        print(f"🌐 NETWORK ERROR in handle_reading:")
        print(f"   • Topic: '{topic if 'topic' in locals() else 'unknown'}'")
        print(f"   • Category: '{category if 'category' in locals() else 'unknown'}'")
        print(f"   • Error: {str(e)}")
        print(f"{'='*60}\n")
        
        return JsonResponse({
            'error': 'Network timeout',
            'message': str(e),
            'topic': topic if 'topic' in locals() else 'unknown',
            'retry_recommended': True
        }, status=503)  # Service Unavailable - client should retry
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