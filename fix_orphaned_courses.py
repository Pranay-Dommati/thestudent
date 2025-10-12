#!/usr/bin/env python3
"""
Fix orphaned course relationships by recreating missing courses
"""

import os
import sys
import django
from pathlib import Path
import json

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import SchoolCourse, EngineeringCourse
from django.db import connection, transaction

def recreate_school_course_from_backup():
    """Recreate the missing school course from JSON backup"""
    print("🔧 Recreating Missing School Course...")
    print("=" * 70)
    
    # Load backup JSON
    try:
        with open('courses_backup.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ courses_backup.json not found!")
        print("💡 Run migrate_local_to_remote.py first to create backup")
        return False
    
    # Find school course
    school_courses = [d for d in data if d['model'] == 'courses.schoolcourse']
    
    if not school_courses:
        print("❌ No school courses found in backup!")
        return False
    
    print(f"Found {len(school_courses)} school course(s) in backup")
    
    for course_data in school_courses:
        course_id = course_data['pk']
        fields = course_data['fields']
        
        print(f"\n📚 Processing: {fields['title']}")
        print(f"   ID: {course_id}")
        
        # Check if course already exists
        try:
            existing = SchoolCourse.objects.get(id=course_id)
            print(f"   ✅ Course already exists")
            continue
        except SchoolCourse.DoesNotExist:
            print(f"   ⚠️  Course missing - will recreate")
        
        # Recreate the course
        try:
            with transaction.atomic():
                course = SchoolCourse(
                    id=course_id,
                    title=fields['title'],
                    short_description=fields['short_description'],
                    description=fields['description'],
                    thumbnail=fields['thumbnail'],
                    duration=fields['duration'],
                    last_updated=fields['last_updated'],
                    created_at=fields['created_at'],
                    is_published=fields['is_published'],
                    class_level=fields['class_level'],
                    board=fields['board'],
                    state=fields.get('state', ''),
                    subject=fields['subject'],
                    sources=fields.get('sources', 'Youtube'),
                    key_topics=fields.get('key_topics', []),
                    learning_points=fields.get('learning_points', [])
                )
                course.save(force_insert=True)
                
                print(f"   ✅ Course recreated successfully!")
                return True
                
        except Exception as e:
            print(f"   ❌ Error recreating course: {e}")
            import traceback
            traceback.print_exc()
            return False

def recreate_engineering_course_from_backup():
    """Recreate the missing engineering course from JSON backup"""
    print("\n🔧 Recreating Missing Engineering Course...")
    print("=" * 70)
    
    # Load backup JSON
    try:
        with open('courses_backup.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        return False
    
    # Find engineering course
    eng_courses = [d for d in data if d['model'] == 'courses.engineeringcourse']
    
    if not eng_courses:
        print("❌ No engineering courses found in backup!")
        return False
    
    print(f"Found {len(eng_courses)} engineering course(s) in backup")
    
    for course_data in eng_courses:
        course_id = course_data['pk']
        fields = course_data['fields']
        
        print(f"\n🔧 Processing: {fields['title']}")
        print(f"   ID: {course_id}")
        
        # Check if course already exists
        try:
            existing = EngineeringCourse.objects.get(id=course_id)
            print(f"   ✅ Course already exists")
            continue
        except EngineeringCourse.DoesNotExist:
            print(f"   ⚠️  Course missing - will recreate")
        
        # Recreate the course
        try:
            with transaction.atomic():
                course = EngineeringCourse(
                    id=course_id,
                    title=fields['title'],
                    short_description=fields['short_description'],
                    description=fields['description'],
                    thumbnail=fields['thumbnail'],
                    duration=fields['duration'],
                    last_updated=fields['last_updated'],
                    created_at=fields['created_at'],
                    is_published=fields['is_published'],
                    user=None,  # fields.get('user')
                    subject=fields.get('subject'),
                    sources=fields.get('sources', 'Youtube'),
                    proficiency=fields.get('proficiency', 'beginner'),
                    certificate_given=fields.get('certificate_given', True),
                    project_based=fields.get('project_based', True),
                    learning_points=fields.get('learning_points', []),
                    requirements=fields.get('requirements', []),
                    category=fields['category']
                )
                course.save(force_insert=True)
                
                print(f"   ✅ Course recreated successfully!")
                return True
                
        except Exception as e:
            print(f"   ❌ Error recreating course: {e}")
            import traceback
            traceback.print_exc()
            return False

def verify_fix():
    """Verify that courses are now accessible"""
    print("\n✅ Verifying Fix...")
    print("=" * 70)
    
    course_id = "95aff5e7-89b4-4aaf-8b05-eedc816a501b"
    
    try:
        course = SchoolCourse.objects.get(id=course_id)
        print(f"✅ School Course accessible!")
        print(f"   Title: {course.title}")
        print(f"   Chapters: {course.chapters.count()}")
        
        # Test accessing chapters
        for chapter in course.chapters.all()[:3]:
            print(f"   - {chapter.name} (Order: {chapter.order})")
        
        return True
    except SchoolCourse.DoesNotExist:
        print(f"❌ School Course still not accessible")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 Course Relationship Fix Tool")
    print("=" * 70)
    print()
    
    # Recreate school course
    school_success = recreate_school_course_from_backup()
    
    # Recreate engineering course  
    eng_success = recreate_engineering_course_from_backup()
    
    # Verify
    if school_success or eng_success:
        verify_fix()
    
    print("\n" + "=" * 70)
    print("🎉 Fix Complete!")
    print("=" * 70)
    print("\n💡 Next Steps:")
    print("   1. Refresh Django admin page")
    print("   2. Try clicking on the course again")
    print("   3. Test enrollment from frontend")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()