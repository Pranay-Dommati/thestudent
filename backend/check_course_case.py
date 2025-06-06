import os
import sys
import django

# Set up Django environment
sys.path.append('c:/Users/banny/OneDrive/Documents/Desktop/megamerge/thestudent/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models
from courses.models import SchoolCourse

def check_hindi_course():
    """
    Check if the Hindi course is properly configured in the database
    """
    # Check for Hindi course using icontains
    hindi_courses = SchoolCourse.objects.filter(subject__icontains="hindi")
    
    print(f"\nFound {hindi_courses.count()} courses with 'hindi' in the subject")
    for course in hindi_courses:
        print(f"ID: {course.id}")
        print(f"Title: {course.title}")
        print(f"Class: {course.class_level}")
        print(f"Board: {course.board}")
        print(f"Subject: {course.subject} (case sensitive!)")
        print(f"Has chapters: {course.chapters.count()}")
        print(f"Is published: {course.is_published}")
        print("-" * 30)
    
    # Check for English course using icontains for comparison
    english_courses = SchoolCourse.objects.filter(subject__icontains="english")
    
    print(f"\nFound {english_courses.count()} courses with 'english' in the subject")
    for course in english_courses:
        print(f"ID: {course.id}")
        print(f"Title: {course.title}")
        print(f"Class: {course.class_level}")
        print(f"Board: {course.board}")
        print(f"Subject: {course.subject} (case sensitive!)")
        print(f"Has chapters: {course.chapters.count()}")
        print(f"Is published: {course.is_published}")
        print("-" * 30)
    
    # Now try direct case matching
    if hindi_courses:
        # Use the exact capitalization from the database
        subject_exact = hindi_courses.first().subject
        exact_courses = SchoolCourse.objects.filter(subject=subject_exact)
        print(f"\nExact match search using '{subject_exact}': {exact_courses.count()} results")

if __name__ == "__main__":
    check_hindi_course()
