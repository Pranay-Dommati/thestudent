from django.http import JsonResponse
from django.conf import settings
import json
from .ai_service import call_gemini_api

def handle_reading(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    try:
        body = json.loads(request.body.decode('utf-8'))
        topic = body.get('topic', '')
        
        prompt = f"""
You are an expert educational content creator specializing in technical topics. Generate comprehensive, engaging learning material.

**Topic**: {topic}

**Requirements**: Create a detailed markdown guide that follows this exact structure:

## 📘 {topic}: Complete Learning Guide

### 🔹 What is {topic}?
- Provide a clear, beginner-friendly definition
- Explain why this topic is important
- Give context about where it fits in the broader field

### 🔹 Core Concepts & Components  
- Break down the main ideas or parts with detailed explanations
- Use bullet points and sub-bullets for clarity with examples
- Include any fundamental principles with practical context
- Explain the relationship between different components
- Provide visual analogies or metaphors where helpful
- Detail the hierarchy or structure of concepts
- Include prerequisites or foundational knowledge needed
- Explain how each component contributes to the whole system
- Add sub-sections for complex topics:
  * **Primary Components**: Essential building blocks
  * **Secondary Elements**: Supporting features or advanced concepts
  * **Integration Points**: How components work together
  * **Dependencies**: What relies on what
- Use numbered lists for sequential concepts
- Include brief code snippets or examples for each major concept
- Explain common terminology and jargon
- Add "Deep Dive" sub-sections for complex components

### 🔹 Technical Details & Syntax
- Show relevant syntax, commands, or structures with detailed examples and explanations
- Use clean, professional code blocks with proper language labels
- Include multiple code examples with clear section headers and descriptions
- Add comprehensive comments within code for better understanding
- Show both basic and advanced syntax variations with clean formatting
- Provide step-by-step syntax breakdown with line-by-line explanations
- Include parameter descriptions and return value explanations
- Add error handling examples and common pitfalls to avoid
- Show alternative syntax approaches and when to use each
- Include interactive examples with "Try this:" sections
- Show different syntax approaches using bullet points and descriptions
- Provide debugging examples and troubleshooting tips
- Include performance considerations for different syntax choices
- Add IDE/editor configuration tips for better syntax highlighting
- Show integration examples with popular frameworks or libraries
- Include command-line usage examples where applicable
- Add configuration file examples and setup instructions
- Provide cross-platform syntax differences if applicable
- Include version-specific syntax variations and compatibility notes
- Add code optimization examples and best practices

### 🔹 Real-World Applications
- Describe practical uses in industry
- Give specific examples of implementations
- Mention popular tools or platforms that use this

### 🔹 Types & Variations
- Explain different types or variations using clear bullet points
- Describe when to use each variation with detailed descriptions and use cases
- Include pros and cons for each type with specific examples
- Add performance comparisons between different types where applicable
- Include scalability considerations for each variation
- Provide cost-benefit analysis for different approaches
- Add compatibility information with different systems or frameworks
- Include learning curve difficulty for each type
- Show code examples or syntax differences for each variation
- Add industry adoption rates and popularity metrics where relevant
- Include historical evolution of different types
- Provide decision-making criteria to help choose between variations
- Add migration paths between different types if applicable
- Include maintenance requirements for each variation
- Show resource requirements (memory, CPU, storage) for different types
- Add security considerations specific to each variation
- Include version compatibility and support lifecycle information
- Provide community support and documentation quality for each type

### 🔹 Practical Example
- Provide multiple detailed, working code examples with clear titles
- Include step-by-step explanation with line-by-line comments
- Show expected output or results in separate code blocks
- Add "Try this:" sections with interactive examples
- Include both beginner and advanced code samples

### 🔹 Common Challenges & Solutions
- List frequent problems beginners encounter
- Provide solutions and best practices
- Include debugging tips

### ✅ Hands-On Practice
- Design a practical exercise
- Include clear instructions and expected outcomes
- Provide hints for completion

**Formatting Rules**:
- Use `##` and `###` for all headers
- Code blocks must specify language: ```python, ```javascript, etc.
- Use **bold** for important terms
- Use bullet points and sub-bullets for structured content
- Keep tone professional and educational
- No apologies, disclaimers, or meta-commentary
- For code examples, always include:
  * Clear descriptive titles before each code block
  * Detailed inline comments explaining each line
  * Expected output in separate clean ``` blocks (no special formatting)
  * Multiple examples showing different use cases
  * Copy-paste ready code that actually works

**Code Block Enhancement Rules**:
- Start each code section with clear, descriptive titles
- Add comprehensive comments within code for clarity
- Show input and output separately with clean formatting
- Include error handling examples where relevant
- Provide multiple difficulty levels with clean progression
- Use consistent indentation and professional code style
- Keep code examples practical and immediately usable

Generate only the markdown content. Be comprehensive but concise.
"""
        
        result = call_gemini_api(prompt)
        return JsonResponse(result, safe=False)
    except Exception as e:
        print(f"❌ Error in reading endpoint: {str(e)}")
        return JsonResponse({'error': f'AI content generation failed: {str(e)}'}, status=500) 