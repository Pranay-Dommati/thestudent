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
        print(f"ID: {course.id}, Title: {course.title}, Class: {course.class_level}, Board: {course.board}, Subject: {course.subject}")

def find_course(subject_keyword=None, class_level=None, board=None):
    queryset = SchoolCourse.objects.all()
    
    if subject_keyword:
        queryset = queryset.filter(subject__icontains=subject_keyword)
    
    if class_level:
        queryset = queryset.filter(class_level=class_level)
    
    if board:
        queryset = queryset.filter(board__iexact=board)
    
    print(f"Found {queryset.count()} matching courses:")
    for course in queryset:
        print(f"ID: {course.id}, Title: {course.title}, Class: {course.class_level}, Board: {course.board}, Subject: {course.subject}")
        print(f"   Chapters: {course.chapters.count()}")
        for i, chapter in enumerate(course.chapters.all(), 1):
            print(f"   - Chapter {i}: {chapter.title} (Lessons: {chapter.lessons.count()})")

if __name__ == "__main__":
    print("\n=== All Courses ===")
    list_all_courses()
    
    print("\n=== Hindi Courses ===")
    find_course(subject_keyword="hindi")
    
    print("\n=== English Courses ===")
    find_course(subject_keyword="english")
    
    print("\n=== 10th CBSE Hindi ===")
    find_course(subject_keyword="hindi", class_level="10th", board="cbse")
    
    print("\n=== 10th CBSE English ===")
    find_course(subject_keyword="english", class_level="10th", board="cbse")
