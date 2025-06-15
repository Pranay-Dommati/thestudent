import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models
from courses.models import SchoolCourse

def list_all_courses():
    courses = SchoolCourse.objects.all()
    print(f"Total courses: {len(courses)}")
    for course in courses:
        print(f"ID: {course.id}, Title: {course.title}, Class: {course.class_level}, Board: {course.board}, State: {getattr(course, 'state', 'N/A')}, Subject: {course.subject}")

def find_course(subject_keyword=None, class_level=None, board=None, state=None):
    queryset = SchoolCourse.objects.all()
    
    if subject_keyword:
        queryset = queryset.filter(subject__icontains=subject_keyword)
    
    if class_level:
        queryset = queryset.filter(class_level=class_level)
    
    if board:
        queryset = queryset.filter(board__iexact=board)
        
    if state:
        queryset = queryset.filter(state__iexact=state)
    
    print(f"Found {queryset.count()} matching courses:")
    for course in queryset:
        print(f"ID: {course.id}, Title: {course.title}, Class: {course.class_level}, Board: {course.board}, State: {getattr(course, 'state', 'N/A')}, Subject: {course.subject}")
        if hasattr(course, 'chapters') and course.chapters.count() > 0:
            print(f"   Chapters: {course.chapters.count()}")
            for i, chapter in enumerate(course.chapters.all(), 1):
                print(f"   - Chapter {i}: {chapter.name} (Lessons: {chapter.lessons.count()})")
        else:
            print("   No chapters found")

if __name__ == "__main__":
    print("\n=== All Courses ===")
    list_all_courses()
    
    print("\n=== State Board Courses ===")
    find_course(board="state")
    
    print("\n=== 10th State Board English Courses ===")
    find_course(subject_keyword="english", class_level="10th", board="state")
    
    print("\n=== 10th State Board TS English Courses ===")
    find_course(subject_keyword="english", class_level="10th", board="state", state="ts")
