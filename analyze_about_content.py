import requests
import json

# Fetch the course data
response = requests.get('http://localhost:8000/api/courses/school/849668ee-1d4b-4e2e-8353-b76a4c94af41/')
course_data = response.json()

print("=== LESSON ABOUT CONTENT ANALYSIS ===\n")

for chapter_idx, chapter in enumerate(course_data['chapters']):
    print(f"Chapter {chapter_idx + 1}: {chapter['name']}")
    print("-" * 50)
    
    for lesson_idx, lesson in enumerate(chapter['lessons']):
        print(f"\nLesson {lesson_idx + 1}: {lesson['title']} (Type: {lesson['type']})")
        print(f"Has about_lesson: {'Yes' if lesson.get('about_lesson') else 'No'}")
        
        if lesson.get('about_lesson'):
            about_content = lesson['about_lesson']
            print(f"Content length: {len(about_content)} characters")
            print(f"Contains markdown indicators:")
            markdown_indicators = {
                'Headers (# ## ###)': '#' in about_content,
                'Bold (**text**)': '**' in about_content,
                'Italic (*text*)': '*' in about_content and '**' not in about_content,
                'Lists (- or 1.)': '-' in about_content or '1.' in about_content,
                'Code blocks (```)': '```' in about_content,
                'Tables (|)': '|' in about_content,
                'Links ([text](url))': '[' in about_content and '](' in about_content,
            }
            
            for indicator, present in markdown_indicators.items():
                print(f"  - {indicator}: {'✓' if present else '✗'}")
            
            print(f"\nRaw content preview (first 200 chars):")
            print(f'"{about_content[:200]}..."')
            print()
        
        print("-" * 30)

print("\n=== SUMMARY ===")
print("This script shows what markdown content is available in the about_lesson fields")
print("and whether they contain markdown formatting indicators.")
