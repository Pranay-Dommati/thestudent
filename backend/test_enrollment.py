#!/usr/bin/env python3

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import SchoolCourse, UserStartedPredefinedCourse
from authentication.models import User

print("=== Testing Course Enrollment System ===")

# Check if there are any school courses
school_courses = SchoolCourse.objects.all()
print(f"\nFound {school_courses.count()} school courses in database:")

for course in school_courses[:5]:  # Show first 5 courses
    print(f"- ID: {course.id}, Title: {course.title}")
    print(f"  Class: {course.class_level}, Board: {course.board}, Subject: {course.subject}")

# Check if there are any users
users = User.objects.all()
print(f"\nFound {users.count()} users in database:")

for user in users[:3]:  # Show first 3 users
    print(f"- ID: {user.id}, Username: {user.username}, Email: {user.email}")

# Check existing enrollments
enrollments = UserStartedPredefinedCourse.objects.all()
print(f"\nFound {enrollments.count()} existing course enrollments:")

for enrollment in enrollments[:5]:  # Show first 5 enrollments
    print(f"- User: {enrollment.user.username}")
    print(f"  Course: {enrollment.get_course_title()}")
    print(f"  Type: {enrollment.course_type}")
    print(f"  Progress: {enrollment.progress_percentage}%")
    print(f"  Started: {enrollment.started_at}")

print("\n=== Testing Complete ===")
