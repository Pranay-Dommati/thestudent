#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.chdir('backend')
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import SchoolCourse, CourseChapter, Lesson

def delete_courses_for_classes():
    """Delete all courses for 6th, 7th, 8th, and 9th classes"""
    
    print("🗑️  Deleting all courses for 6th, 7th, 8th, and 9th classes...")
    
    classes_to_delete = ['6th', '7th', '8th', '9th']
    
    total_deleted = 0
    
    for class_level in classes_to_delete:
        # Get all courses for this class
        courses = SchoolCourse.objects.filter(class_level=class_level)
        course_count = courses.count()
        
        if course_count > 0:
            print(f"\n📋 Found {course_count} courses for {class_level} class:")
            
            # Show courses before deletion
            for course in courses:
                print(f"   - {course.title}")
            
            # Delete all courses for this class (this will cascade delete chapters and lessons)
            courses.delete()
            print(f"✅ Deleted {course_count} courses for {class_level} class")
            total_deleted += course_count
        else:
            print(f"ℹ️  No courses found for {class_level} class")
    
    print(f"\n🎉 Successfully deleted {total_deleted} courses in total!")
    
    # Verify deletion
    print("\n🔍 Verification - Remaining courses by class:")
    for class_level in ['6th', '7th', '8th', '9th', '10th', '11th', '12th']:
        count = SchoolCourse.objects.filter(class_level=class_level).count()
        print(f"   {class_level}: {count} courses")
    
    return total_deleted

if __name__ == "__main__":
    try:
        deleted_count = delete_courses_for_classes()
        print(f"\n✨ Course deletion completed successfully! Deleted {deleted_count} courses.")
    except Exception as e:
        print(f"\n❌ Error deleting courses: {e}")
        import traceback
        traceback.print_exc()
