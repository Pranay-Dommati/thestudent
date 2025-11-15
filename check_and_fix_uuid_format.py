#!/usr/bin/env python3
"""
Check UUID format mismatch between database and Django
Django stores UUIDs with hyphens (36 chars), but DB might have them without (32 chars)
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

from django.db import connection
import uuid

def check_uuid_format_in_db():
    """Check how UUIDs are stored in the database"""
    print("🔍 Checking UUID Storage Format in Database...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # Check school course
        cursor.execute("""
            SELECT id, title FROM courses_schoolcourse LIMIT 1
        """)
        
        row = cursor.fetchone()
        if row:
            db_id = row[0]
            title = row[1]
            
            print(f"📚 School Course in Database:")
            print(f"   Title: {title}")
            print(f"   ID from DB: '{db_id}'")
            print(f"   ID Length: {len(db_id)} characters")
            
            # Check if it has hyphens
            if '-' in db_id:
                print(f"   ✅ Format: UUID with hyphens (correct)")
            else:
                print(f"   ⚠️  Format: UUID without hyphens (PROBLEM!)")
                print(f"   Expected: {format_uuid_with_hyphens(db_id)}")
            
            return db_id, '-' in db_id
        else:
            print("❌ No school courses found in database")
            return None, None

def format_uuid_with_hyphens(uuid_str):
    """Format a UUID string without hyphens to include hyphens"""
    if len(uuid_str) == 32:
        # Format: 8-4-4-4-12
        return f"{uuid_str[0:8]}-{uuid_str[8:12]}-{uuid_str[12:16]}-{uuid_str[16:20]}-{uuid_str[20:32]}"
    return uuid_str

def test_django_query(db_id, has_hyphens):
    """Test if Django can query the course"""
    print(f"\n🔍 Testing Django ORM Query...")
    print("=" * 70)
    
    from courses.models import SchoolCourse
    
    # Try with the exact ID from database
    print(f"\n1️⃣ Querying with database ID: '{db_id}'")
    try:
        course = SchoolCourse.objects.get(id=db_id)
        print(f"   ✅ Found: {course.title}")
        return True
    except SchoolCourse.DoesNotExist:
        print(f"   ❌ Not found with database ID")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # If DB has no hyphens, try with hyphens
    if not has_hyphens:
        formatted_id = format_uuid_with_hyphens(db_id)
        print(f"\n2️⃣ Querying with formatted ID: '{formatted_id}'")
        try:
            course = SchoolCourse.objects.get(id=formatted_id)
            print(f"   ✅ Found: {course.title}")
            return True
        except SchoolCourse.DoesNotExist:
            print(f"   ❌ Not found with formatted ID")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Try as UUID object
    try:
        if has_hyphens:
            uuid_obj = uuid.UUID(db_id)
        else:
            uuid_obj = uuid.UUID(format_uuid_with_hyphens(db_id))
        
        print(f"\n3️⃣ Querying with UUID object: {uuid_obj}")
        try:
            course = SchoolCourse.objects.get(id=uuid_obj)
            print(f"   ✅ Found: {course.title}")
            return True
        except SchoolCourse.DoesNotExist:
            print(f"   ❌ Not found with UUID object")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    except Exception as e:
        print(f"   ❌ Cannot create UUID object: {e}")
    
    return False

def fix_uuid_format():
    """Fix UUID format by adding hyphens if needed"""
    print(f"\n🔧 Fixing UUID Format...")
    print("=" * 70)
    
    response = input("\n⚠️  This will update all UUIDs in the database. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("   ℹ️  Operation cancelled")
        return False
    
    with connection.cursor() as cursor:
        try:
            # Get all courses with UUIDs without hyphens
            cursor.execute("""
                SELECT id, title FROM courses_schoolcourse 
                WHERE id NOT LIKE '%-%'
            """)
            
            courses_to_fix = cursor.fetchall()
            
            if not courses_to_fix:
                print("✅ All UUIDs already have hyphens!")
                return True
            
            print(f"\nFound {len(courses_to_fix)} courses with UUIDs needing formatting")
            
            for old_id, title in courses_to_fix:
                new_id = format_uuid_with_hyphens(old_id)
                print(f"\n📚 {title}")
                print(f"   Old ID: {old_id}")
                print(f"   New ID: {new_id}")
                
                # Update the course ID
                cursor.execute("""
                    UPDATE courses_schoolcourse 
                    SET id = %s 
                    WHERE id = %s
                """, [new_id, old_id])
                
                # Update related chapter IDs
                cursor.execute("""
                    UPDATE courses_coursechapter 
                    SET school_course_id = %s 
                    WHERE school_course_id = %s
                """, [new_id, old_id])
                
                print(f"   ✅ Updated")
            
            # Do the same for engineering courses
            cursor.execute("""
                SELECT id, title FROM courses_engineeringcourse 
                WHERE id NOT LIKE '%-%'
            """)
            
            eng_courses_to_fix = cursor.fetchall()
            
            for old_id, title in eng_courses_to_fix:
                new_id = format_uuid_with_hyphens(old_id)
                print(f"\n🔧 {title}")
                print(f"   Old ID: {old_id}")
                print(f"   New ID: {new_id}")
                
                cursor.execute("""
                    UPDATE courses_engineeringcourse 
                    SET id = %s 
                    WHERE id = %s
                """, [new_id, old_id])
                
                cursor.execute("""
                    UPDATE courses_coursesection 
                    SET engineering_course_id = %s 
                    WHERE engineering_course_id = %s
                """, [new_id, old_id])
                
                print(f"   ✅ Updated")
            
            print(f"\n✅ Fixed {len(courses_to_fix) + len(eng_courses_to_fix)} courses!")
            return True
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

def verify_fix():
    """Verify that courses are now accessible"""
    print(f"\n✅ Verifying Fix...")
    print("=" * 70)
    
    from courses.models import SchoolCourse, EngineeringCourse
    
    # Try to access all courses
    try:
        school_courses = SchoolCourse.objects.all()
        print(f"\n📚 School Courses: {school_courses.count()}")
        
        for course in school_courses:
            print(f"   ✅ {course.title}")
            print(f"      ID: {course.id}")
            print(f"      Chapters: {course.chapters.count()}")
        
        eng_courses = EngineeringCourse.objects.all()
        print(f"\n🔧 Engineering Courses: {eng_courses.count()}")
        
        for course in eng_courses:
            print(f"   ✅ {course.title}")
            print(f"      ID: {course.id}")
            print(f"      Sections: {course.sections.count()}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 UUID Format Checker & Fixer")
    print("=" * 70)
    print()
    
    # Step 1: Check current format
    db_id, has_hyphens = check_uuid_format_in_db()
    
    if db_id is None:
        return
    
    # Step 2: Test Django query
    can_query = test_django_query(db_id, has_hyphens)
    
    # Step 3: Fix if needed
    if not can_query and not has_hyphens:
        print("\n" + "=" * 70)
        print("⚠️  ISSUE FOUND: UUIDs are stored without hyphens")
        print("   Django expects UUIDs with hyphens")
        print("   This causes the 'doesn't exist' error in admin")
        print("=" * 70)
        
        if fix_uuid_format():
            verify_fix()
    elif can_query:
        print("\n✅ No fix needed - UUIDs are accessible!")
        verify_fix()
    
    print("\n" + "=" * 70)
    print("🎉 Done!")
    print("=" * 70)
    print("\n💡 Next Steps:")
    print("   1. Refresh Django admin page")
    print("   2. Click on a course - should work now!")
    print("   3. Test enrollment from frontend")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()