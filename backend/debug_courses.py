import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import the model
from courses.models import SchoolCourse

# List all courses
courses = SchoolCourse.objects.all()
print(f"Found {len(courses)} courses")

# Check if any state board courses exist
state_courses = SchoolCourse.objects.filter(board='state')
print(f"Found {len(state_courses)} state board courses")

# Check specifically for 10th state board English courses
target_courses = SchoolCourse.objects.filter(class_level='10th', board='state', subject__icontains='english')
print(f"Found {len(target_courses)} 10th state English courses")

# Print details of all courses for debugging
print("\nAll courses:")
for i, course in enumerate(courses, 1):
    print(f"{i}. {course.title} - Class: {course.class_level}, Board: {course.board}, Subject: {course.subject}")
    if hasattr(course, 'state') and course.state:
        print(f"   State: {course.state}")
