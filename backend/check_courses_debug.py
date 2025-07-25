#!/usr/bin/env python3

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append('/mnt/c/Users/banny/OneDrive/Documents/Desktop/SHPRO/thestudent/backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import Course

def check_courses():
    print("=== ALL COURSES IN DATABASE ===")
    
    courses = Course.objects.all()
    print(f"Total courses: {courses.count()}")
    
    for course in courses:
        print(f"\nCourse ID: {course.id}")
        print(f"Title: {course.title}")
        print(f"Class: {course.className}")
        print(f"Board: {course.board}")
        print(f"Subject: {course.subject}")
        print(f"State: {course.state}")
        print(f"Course Type: {course.course_type}")
        print(f"Chapters: {course.chapters.count()}")
        
        # Show chapter/lesson structure
        for i, chapter in enumerate(course.chapters.all()):
            print(f"  Chapter {i+1}: {chapter.title} ({chapter.lessons.count()} lessons)")
            
            # Show first few lessons
            for j, lesson in enumerate(chapter.lessons.all()[:3]):
                print(f"    Lesson {j+1}: {lesson.title} (Type: {lesson.type})")
                print(f"      About Lesson Length: {len(lesson.aboutLesson) if lesson.aboutLesson else 0} chars")
                print(f"      Has Resources: {bool(lesson.resources)}")
                
                if lesson.resources:
                    resources = lesson.resources
                    downloadable = resources.get('downloadable', [])
                    internet = resources.get('internet', [])
                    print(f"      Downloadable Resources: {len(downloadable)}")
                    print(f"      Internet Resources: {len(internet)}")
            
            if chapter.lessons.count() > 3:
                print(f"    ... and {chapter.lessons.count() - 3} more lessons")
        print("-" * 60)
    
    # Check for specific Hindi course
    print("\n=== HINDI COURSES ===")
    hindi_courses = Course.objects.filter(subject__icontains='hindi')
    print(f"Hindi courses found: {hindi_courses.count()}")
    
    for course in hindi_courses:
        print(f"Hindi Course: {course.title}")
        print(f"Class: {course.className}, Board: {course.board}, Subject: {course.subject}")
        print(f"ID: {course.id}")

if __name__ == "__main__":
    check_courses()
