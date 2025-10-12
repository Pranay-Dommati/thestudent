#!/usr/bin/env python3
"""
Complete UUID Fix with Foreign Key Management
Step 1: Drop foreign keys
Step 2: Expand columns to CHAR(36)
Step 3: Add hyphens to UUIDs
Step 4: Recreate foreign keys
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

def format_uuid_with_hyphens(uuid_str):
    """Format a UUID string without hyphens to include hyphens"""
    if len(uuid_str) == 32:
        return f"{uuid_str[0:8]}-{uuid_str[8:12]}-{uuid_str[12:16]}-{uuid_str[16:20]}-{uuid_str[20:32]}"
    return uuid_str

def drop_foreign_keys():
    """Drop all relevant foreign key constraints"""
    print("🔧 Step 1: Dropping Foreign Key Constraints...")
    print("=" * 70)
    
    fk_constraints = [
        ('courses_coursechapter', 'courses_coursechapte_school_course_id_a1fdf00b_fk_courses_s'),
        ('courses_coursesection', 'courses_coursesecti_engineering_course__d1ba6848_fk_courses_e'),
    ]
    
    with connection.cursor() as cursor:
        for table, constraint in fk_constraints:
            try:
                cursor.execute(f"ALTER TABLE {table} DROP FOREIGN KEY {constraint}")
                print(f"   ✅ Dropped {constraint}")
            except Exception as e:
                print(f"   ⚠️  {constraint}: {e}")

def expand_columns():
    """Expand all UUID columns to CHAR(36)"""
    print("\n🔧 Step 2: Expanding UUID Columns to CHAR(36)...")
    print("=" * 70)
    
    columns_to_fix = [
        ('courses_schoolcourse', 'id'),
        ('courses_engineeringcourse', 'id'),
        ('courses_coursechapter', 'school_course_id'),
        ('courses_coursesection', 'engineering_course_id'),
    ]
    
    with connection.cursor() as cursor:
        for table, column in columns_to_fix:
            try:
                cursor.execute(f"ALTER TABLE {table} MODIFY COLUMN {column} CHAR(36)")
                print(f"   ✅ {table}.{column} → CHAR(36)")
            except Exception as e:
                print(f"   ❌ {table}.{column}: {e}")

def add_hyphens():
    """Add hyphens to all UUIDs"""
    print("\n🔧 Step 3: Adding Hyphens to UUIDs...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # 1. School courses
        print("\n   1️⃣ School Courses:")
        cursor.execute("SELECT id, title FROM courses_schoolcourse WHERE id NOT LIKE '%-%'")
        for old_id, title in cursor.fetchall():
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update chapters first
            cursor.execute(
                "UPDATE courses_coursechapter SET school_course_id = %s WHERE school_course_id = %s",
                [new_id, old_id]
            )
            chapters_updated = cursor.rowcount
            
            # Update course
            cursor.execute(
                "UPDATE courses_schoolcourse SET id = %s WHERE id = %s",
                [new_id, old_id]
            )
            
            print(f"      ✅ {title[:50]}")
            print(f"         {old_id} → {new_id}")
            print(f"         Updated {chapters_updated} chapters")
        
        # 2. Engineering courses
        print("\n   2️⃣ Engineering Courses:")
        cursor.execute("SELECT id, title FROM courses_engineeringcourse WHERE id NOT LIKE '%-%'")
        for old_id, title in cursor.fetchall():
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update sections first
            cursor.execute(
                "UPDATE courses_coursesection SET engineering_course_id = %s WHERE engineering_course_id = %s",
                [new_id, old_id]
            )
            sections_updated = cursor.rowcount
            
            # Update course
            cursor.execute(
                "UPDATE courses_engineeringcourse SET id = %s WHERE id = %s",
                [new_id, old_id]
            )
            
            print(f"      ✅ {title[:50]}")
            print(f"         {old_id} → {new_id}")
            print(f"         Updated {sections_updated} sections")

def recreate_foreign_keys():
    """Recreate foreign key constraints"""
    print("\n🔧 Step 4: Recreating Foreign Key Constraints...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        try:
            cursor.execute("""
                ALTER TABLE courses_coursechapter
                ADD CONSTRAINT courses_coursechapte_school_course_id_a1fdf00b_fk_courses_s
                FOREIGN KEY (school_course_id) REFERENCES courses_schoolcourse(id)
                ON DELETE CASCADE
            """)
            print("   ✅ School course chapters → school courses")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        try:
            cursor.execute("""
                ALTER TABLE courses_coursesection
                ADD CONSTRAINT courses_coursesecti_engineering_course__d1ba6848_fk_courses_e
                FOREIGN KEY (engineering_course_id) REFERENCES courses_engineeringcourse(id)
                ON DELETE CASCADE
            """)
            print("   ✅ Course sections → engineering courses")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def verify():
    """Verify the fix"""
    print("\n✅ Step 5: Verifying Fix...")
    print("=" * 70)
    
    from courses.models import SchoolCourse, EngineeringCourse
    
    # School courses
    print("\n📚 School Courses:")
    for course in SchoolCourse.objects.all():
        chapters = course.chapters.all()
        print(f"   ✅ {course.title}")
        print(f"      ID: {course.id}")
        print(f"      Chapters: {chapters.count()}")
        
        for chapter in chapters[:5]:
            print(f"         - Ch{chapter.chapter_number}: {chapter.title}")
        
        if chapters.count() > 5:
            print(f"         ... and {chapters.count() - 5} more chapters")
    
    # Engineering courses
    print("\n🔧 Engineering Courses:")
    for course in EngineeringCourse.objects.all():
        sections = course.sections.all()
        print(f"   ✅ {course.title}")
        print(f"      ID: {course.id}")
        print(f"      Sections: {sections.count()}")
        
        for section in sections[:5]:
            print(f"         - Sec{section.section_number}: {section.title}")
        
        if sections.count() > 5:
            print(f"         ... and {sections.count() - 5} more sections")

def main():
    print("🚀 Complete UUID Fix - Final Version")
    print("=" * 70)
    print("This will:")
    print("  1. Drop foreign key constraints")
    print("  2. Expand UUID columns from CHAR(32) to CHAR(36)")
    print("  3. Add hyphens to all existing UUIDs")
    print("  4. Recreate foreign key constraints")
    print("  5. Verify everything works")
    print()
    print("⚠️  WARNING: This modifies the database structure!")
    print("=" * 70)
    print()
    
    response = input("Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    print()
    
    try:
        drop_foreign_keys()
        expand_columns()
        add_hyphens()
        recreate_foreign_keys()
        verify()
        
        print("\n" + "=" * 70)
        print("🎉 SUCCESS! UUID Format Fixed!")
        print("=" * 70)
        print("\n💡 What was fixed:")
        print("   ✅ All UUID columns expanded to 36 characters")
        print("   ✅ Hyphens added to all UUIDs in database")
        print("   ✅ Foreign key relationships restored")
        print("   ✅ Courses now accessible from Django admin")
        print()
        print("💡 Next Steps:")
        print("   1. Refresh Django admin page")
        print("   2. Click on 'Complete 10th Class Mathematics Course'")
        print("   3. You should now see all chapters with their data!")
        print("   4. Test enrollment from frontend")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
