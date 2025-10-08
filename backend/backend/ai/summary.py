from django.http import JsonResponse
from django.conf import settings
from .ai_service import call_gemini_api
from .sanitization import sanitize_ai_content
import json

def handle_summary(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        body = json.loads(request.body.decode('utf-8'))
        topic = body.get('topic', '')
        reading_content = body.get('reading_content', '')
        category = body.get('category', 'academic')  # Default to 'academic' for aggressive sanitization
        
        if reading_content and len(reading_content) > 100:
            prompt = f"""
You are an expert educational content summarizer. Your task is to create a comprehensive yet concise summary of the provided reading material. Focus on extracting the ACTUAL information from the content, not generating generic templates.

**Learning Focus**: {topic}

**Source Content to Summarize:**
{reading_content}

**Instructions:**
Analyze the above content and create a structured summary that captures the ACTUAL information presented. Do NOT create generic templates or placeholder content.

## 📋 Content Summary

### 🎯 Main Topics Covered
- Extract and list the actual main topics/concepts discussed in the content
- Include specific details mentioned in the source material
- Focus on what was actually taught or explained

### 💡 Key Information & Facts
- Summarize the specific facts, data, or information presented
- Include important definitions, explanations, or concepts from the content
- Highlight any formulas, procedures, or step-by-step processes mentioned

### 🔧 Practical Examples & Applications
- Summarize any examples, use cases, or applications mentioned in the content
- Include specific implementations or real-world scenarios discussed
- Note any tools, technologies, or methods specifically referenced

### ⚡ Important Points & Takeaways
- Extract the most critical information from the content
- Include any warnings, tips, or best practices mentioned
- Highlight conclusions or key insights from the source material

### 📚 Additional Details
- Summarize any supporting information, context, or background provided
- Include relevant statistics, comparisons, or analysis from the content
- Note any references to further resources or next steps mentioned

**Critical Requirements:**
- Base your summary ONLY on the actual content provided
- Do NOT add generic information not present in the source
- Extract and synthesize the real information, don't create templates
- Keep the summary comprehensive but concise
- Use specific details from the source material
- Maintain the factual accuracy of the original content

Generate only the markdown summary based on the ACTUAL content provided above.
"""
        else:
            prompt = f"""
You are an expert educational content summarizer. Create a comprehensive learning summary for the topic: "{topic}"

**Topic Focus**: {topic}

**Requirements:**
Create a well-structured summary specifically focused on "{topic}" that includes:

## 📋 {topic}: Key Learning Summary

### 🎯 Core Concepts
- List the 5-7 most essential concepts for understanding {topic}
- Focus on fundamental principles that define {topic}
- Include key terminology and definitions specific to {topic}
- Explain why {topic} is important and relevant

### 💡 Essential Knowledge Points
- Critical information every {topic} learner must know
- Important formulas, commands, or syntax related to {topic}
- Key features and capabilities of {topic}
- Common use cases and applications

### 🔧 Practical Implementation
- How {topic} is used in real-world scenarios
- Step-by-step approach to getting started with {topic}
- Best practices for working with {topic}
- Common tools and technologies used with {topic}

### ⚡ Quick Reference Guide
- Essential {topic} commands or syntax (if applicable)
- Key facts and figures about {topic}
- Important concepts for quick recall
- Troubleshooting tips and common solutions

### 📚 Learning Roadmap
- Recommended learning sequence for {topic}
- Prerequisites needed before studying {topic}
- Next steps after mastering {topic} basics
- Resources for continued learning

### 🚨 Common Pitfalls & Solutions
- Typical mistakes beginners make with {topic}
- How to avoid common problems
- Debugging strategies specific to {topic}
- Expert tips for mastering {topic}

**Formatting Guidelines:**
- Use clear, topic-focused language
- Keep explanations concise but comprehensive
- Use markdown formatting for structure
- Include actionable insights
- Focus specifically on {topic} throughout
- Make it a practical learning reference

Generate only the markdown summary content focused on "{topic}". Be comprehensive yet concise.
"""
        try:
            # Use ai_service with dual key support
            result = call_gemini_api(prompt)
            
            # Apply sanitization to summary content
            if isinstance(result, dict) and 'content' in result:
                summary_content = result.get('content', '')
                
                # Log before sanitization
                print(f"📝 SUMMARY SANITIZATION:")
                print(f"   • Topic: {topic}")
                print(f"   • Category: {category} (using for aggressive sanitization)")
                print(f"   • Content length: {len(summary_content)} characters")
                latex_before = summary_content[:500].count('$')
                backticks_before = summary_content[:500].count('`')
                print(f"   • LaTeX $ symbols (first 500 chars): {latex_before}")
                print(f"   • Backticks ` (first 500 chars): {backticks_before}")
                
                # Apply comprehensive sanitization using the same category as reading content
                # This ensures summaries get the same aggressive treatment for academic/math topics
                sanitized_content, changes = sanitize_ai_content(summary_content, category)
                
                if changes['total'] > 0:
                    print(f"   ✅ Summary sanitization complete:")
                    print(f"      • LaTeX removed: {changes['latex_removed']}")
                    print(f"      • Excessive inline code cleaned: {changes['inline_code_cleaned']}")
                    print(f"      • Code fences sanitized: {changes['fences_sanitized']}")
                    print(f"      • Indented blocks cleaned: {changes['indents_cleaned']}")
                    print(f"      • Total changes: {changes['total']}")
                    
                    # Verify cleanup
                    latex_after = sanitized_content[:500].count('$')
                    backticks_after = sanitized_content[:500].count('`')
                    print(f"   • LaTeX $ symbols after: {latex_after}")
                    print(f"   • Backticks ` after: {backticks_after}")
                else:
                    print(f"   ✅ No sanitization needed - summary is clean")
                
                # Update result with sanitized content
                result['content'] = sanitized_content
                result['sanitization_applied'] = changes['total'] > 0
                result['sanitization_changes'] = changes
            
            return JsonResponse(result, safe=False)
        except Exception as api_error:
            return JsonResponse({'error': f'AI service error: {str(api_error)}'}, status=500)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 