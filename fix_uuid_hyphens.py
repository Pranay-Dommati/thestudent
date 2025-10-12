#!/usr/bin/env python3
"""
Fix UUID format - Add hyphens to UUIDs in database
This fixes the "doesn't exist" error in Django admin
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection, transaction

def format_uuid_with_hyphens(uuid_str):
    """Format a UUID string without hyphens to include hyphens"""
    if len(uuid_str) == 32:
        # Format: 8-4-4-4-12
        return f"{uuid_str[0:8]}-{uuid_str[8:12]}-{uuid_str[12:16]}-{uuid_str[16:20]}-{uuid_str[20:32]}"
    return uuid_str

def fix_school_courses():
    """Fix school courses UUID format"""
    print("🔧 Fixing School Courses...")
    
    with connection.cursor() as cursor:
        # Get all courses without hyphens
        cursor.execute("""
            SELECT id, title FROM courses_schoolcourse 
            WHERE id NOT LIKE '%-%'
        """)
        
        courses = cursor.fetchall()
        
        if not courses:
            print("   ✅ All school course UUIDs already have hyphens")
            return 0
        
        print(f"   Found {len(courses)} courses to fix")
        
        fixed = 0
        for old_id, title in courses:
            new_id = format_uuid_with_hyphens(old_id)
            
            try:
                with transaction.atomic():
                    # Update chapters first (foreign key)
                    cursor.execute("""
                        UPDATE courses_coursechapter 
                        SET school_course_id = %s 
                        WHERE school_course_id = %s
                    """, [new_id, old_id])
                    
                    chapters_updated = cursor.rowcount
                    
                    # Update the course
                    cursor.execute("""
                        UPDATE courses_schoolcourse 
                        SET id = %s 
                        WHERE id = %s
                    """, [new_id, old_id])
                    
                    print(f"   ✅ {title}")
                    print(f"      Old: {old_id}")
                    print(f"      New: {new_id}")
                    print(f"      Chapters updated: {chapters_updated}")
                    fixed += 1
                    
            except Exception as e:
                print(f"   ❌ Error updating {title}: {e}")
        
        return fixed

def fix_engineering_courses():
    """Fix engineering courses UUID format"""
    print("\n🔧 Fixing Engineering Courses...")
    
    with connection.cursor() as cursor:
        # Get all courses without hyphens
        cursor.execute("""
            SELECT id, title FROM courses_engineeringcourse 
            WHERE id NOT LIKE '%-%'
        """)
        
        courses = cursor.fetchall()
        
        if not courses:
            print("   ✅ All engineering course UUIDs already have hyphens")
            return 0
        
        print(f"   Found {len(courses)} courses to fix")
        
        fixed = 0
        for old_id, title in courses:
            new_id = format_uuid_with_hyphens(old_id)
            
            try:
                with transaction.atomic():
                    # Update sections first (foreign key)
                    cursor.execute("""
                        UPDATE courses_coursesection 
                        SET engineering_course_id = %s 
                        WHERE engineering_course_id = %s
                    """, [new_id, old_id])
                    
                    sections_updated = cursor.rowcount
                    
                    # Update the course
                    cursor.execute("""
                        UPDATE courses_engineeringcourse 
                        SET id = %s 
                        WHERE id = %s
                    """, [new_id, old_id])
                    
                    print(f"   ✅ {title}")
                    print(f"      Old: {old_id}")
                    print(f"      New: {new_id}")
                    print(f"      Sections updated: {sections_updated}")
                    fixed += 1
                    
            except Exception as e:
                print(f"   ❌ Error updating {title}: {e}")
        
        return fixed

def verify_fix():
    """Verify that Django can now access the courses"""
    print("\n✅ Verifying Fix...")
    print("=" * 70)
    
    from courses.models import SchoolCourse, EngineeringCourse
    
    try:
        # Test school courses
        school_courses = SchoolCourse.objects.all()
        print(f"\n📚 School Courses: {school_courses.count()}")
        
        for course in school_courses:
            chapters = course.chapters.all()
            print(f"   ✅ {course.title}")
            print(f"      ID: {course.id}")
            print(f"      Chapters: {chapters.count()}")
            
            # Show first few chapter titles
            for i, chapter in enumerate(chapters[:3]):
                print(f"         - Chapter {chapter.chapter_number}: {chapter.title}")
            
            if chapters.count() > 3:
                print(f"         ... and {chapters.count() - 3} more chapters")
        
        # Test engineering courses
        eng_courses = EngineeringCourse.objects.all()
        print(f"\n🔧 Engineering Courses: {eng_courses.count()}")
        
        for course in eng_courses:
            sections = course.sections.all()
            print(f"   ✅ {course.title}")
            print(f"      ID: {course.id}")
            print(f"      Sections: {sections.count()}")
            
            # Show first few section titles
            for i, section in enumerate(sections[:3]):
                print(f"         - Section {section.section_number}: {section.title}")
            
            if sections.count() > 3:
                print(f"         ... and {sections.count() - 3} more sections")
        
        print("\n✅ SUCCESS! All courses are now accessible!")
        return True
        
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 UUID Hyphen Fixer")
    print("=" * 70)
    print("This will add hyphens to UUIDs stored without them")
    print("=" * 70)
    print()
    
    response = input("⚠️  Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    print()
    
    try:
        # Fix school courses
        school_fixed = fix_school_courses()
        
        # Fix engineering courses
        eng_fixed = fix_engineering_courses()
        
        # Verify
        if school_fixed > 0 or eng_fixed > 0:
            print(f"\n" + "=" * 70)
            print(f"✅ Fixed {school_fixed} school courses and {eng_fixed} engineering courses")
            print("=" * 70)
            
            verify_fix()
        else:
            print("\n✅ No courses needed fixing!")
            verify_fix()
        
        print("\n" + "=" * 70)
        print("🎉 Done!")
        print("=" * 70)
        print("\n💡 Next Steps:")
        print("   1. Refresh Django admin page in browser")
        print("   2. Click on 'Complete 10th Class Mathematics Course' - should work now!")
        print("   3. You should see all 14 chapters")
        print("   4. Test enrollment from frontend")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
