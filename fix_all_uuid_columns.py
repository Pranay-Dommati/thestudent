#!/usr/bin/env python3
"""
Fix ALL UUID columns in the database
Expand from CHAR(32) to CHAR(36) to accommodate hyphens
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

def check_column_sizes():
    """Check current column sizes"""
    print("🔍 Checking UUID Column Sizes...")
    print("=" * 70)
    
    tables_to_check = {
        'courses_schoolcourse': ['id'],
        'courses_engineeringcourse': ['id'],
        'courses_coursechapter': ['id', 'school_course_id'],
        'courses_coursesection': ['id', 'engineering_course_id'],
    }
    
    issues = []
    
    with connection.cursor() as cursor:
        for table, columns in tables_to_check.items():
            for column in columns:
                cursor.execute(f"""
                    SELECT CHARACTER_MAXIMUM_LENGTH 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = '{table}'
                    AND COLUMN_NAME = '{column}'
                """)
                
                result = cursor.fetchone()
                if result and result[0] is not None:
                    max_length = result[0]
                    status = "✅" if max_length >= 36 else "⚠️ "
                    print(f"{status} {table}.{column}: CHAR({max_length})")
                    
                    if max_length < 36:
                        issues.append((table, column))
                else:
                    print(f"⚠️  {table}.{column}: Column not found or not CHAR type")
                    issues.append((table, column))
    
    return issues

def fix_column_sizes(issues):
    """Fix column sizes to CHAR(36)"""
    print(f"\n🔧 Fixing {len(issues)} Column(s)...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        for table, column in issues:
            print(f"\n📝 Fixing {table}.{column}")
            
            try:
                # Temporarily disable foreign key checks
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                
                # Alter the column
                cursor.execute(f"""
                    ALTER TABLE {table} 
                    MODIFY COLUMN {column} CHAR(36)
                """)
                
                # Re-enable foreign key checks
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
                
                print(f"   ✅ Expanded to CHAR(36)")
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
                raise

def add_hyphens_to_uuids():
    """Add hyphens to all UUIDs in the database"""
    print(f"\n🔧 Adding Hyphens to UUIDs...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # School courses
        print("\n1️⃣ School Courses:")
        cursor.execute("""
            SELECT id, title FROM courses_schoolcourse 
            WHERE id NOT LIKE '%-%'
        """)
        
        courses = cursor.fetchall()
        for old_id, title in courses:
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update chapters first
            cursor.execute("""
                UPDATE courses_coursechapter 
                SET school_course_id = %s 
                WHERE school_course_id = %s
            """, [new_id, old_id])
            
            chapters_updated = cursor.rowcount
            
            # Update course
            cursor.execute("""
                UPDATE courses_schoolcourse 
                SET id = %s 
                WHERE id = %s
            """, [new_id, old_id])
            
            print(f"   ✅ {title}: {old_id} → {new_id} ({chapters_updated} chapters)")
        
        # Engineering courses
        print("\n2️⃣ Engineering Courses:")
        cursor.execute("""
            SELECT id, title FROM courses_engineeringcourse 
            WHERE id NOT LIKE '%-%'
        """)
        
        courses = cursor.fetchall()
        for old_id, title in courses:
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update sections first
            cursor.execute("""
                UPDATE courses_coursesection 
                SET engineering_course_id = %s 
                WHERE engineering_course_id = %s
            """, [new_id, old_id])
            
            sections_updated = cursor.rowcount
            
            # Update course
            cursor.execute("""
                UPDATE courses_engineeringcourse 
                SET id = %s 
                WHERE id = %s
            """, [new_id, old_id])
            
            print(f"   ✅ {title}: {old_id} → {new_id} ({sections_updated} sections)")
        
        # Chapters (their own IDs)
        print("\n3️⃣ Course Chapters:")
        cursor.execute("""
            SELECT id FROM courses_coursechapter 
            WHERE id NOT LIKE '%-%'
        """)
        
        chapter_ids = cursor.fetchall()
        for (old_id,) in chapter_ids:
            new_id = format_uuid_with_hyphens(old_id)
            cursor.execute("""
                UPDATE courses_coursechapter 
                SET id = %s 
                WHERE id = %s
            """, [new_id, old_id])
        
        print(f"   ✅ Updated {len(chapter_ids)} chapter IDs")
        
        # Sections (their own IDs)
        print("\n4️⃣ Course Sections:")
        cursor.execute("""
            SELECT id FROM courses_coursesection 
            WHERE id NOT LIKE '%-%'
        """)
        
        section_ids = cursor.fetchall()
        for (old_id,) in section_ids:
            new_id = format_uuid_with_hyphens(old_id)
            cursor.execute("""
                UPDATE courses_coursesection 
                SET id = %s 
                WHERE id = %s
            """, [new_id, old_id])
        
        print(f"   ✅ Updated {len(section_ids)} section IDs")

def verify_fix():
    """Verify that everything works"""
    print(f"\n✅ Verifying Fix...")
    print("=" * 70)
    
    from courses.models import SchoolCourse, EngineeringCourse
    
    # School courses
    school_courses = SchoolCourse.objects.all()
    print(f"\n📚 School Courses: {school_courses.count()}")
    
    for course in school_courses:
        chapters = course.chapters.all()
        print(f"   ✅ {course.title}")
        print(f"      ID: {course.id}")
        print(f"      Chapters: {chapters.count()}")
        
        for chapter in chapters[:3]:
            print(f"         - Ch{chapter.chapter_number}: {chapter.title}")
        
        if chapters.count() > 3:
            print(f"         ... and {chapters.count() - 3} more")
    
    # Engineering courses
    eng_courses = EngineeringCourse.objects.all()
    print(f"\n🔧 Engineering Courses: {eng_courses.count()}")
    
    for course in eng_courses:
        sections = course.sections.all()
        print(f"   ✅ {course.title}")
        print(f"      ID: {course.id}")
        print(f"      Sections: {sections.count()}")
        
        for section in sections[:3]:
            print(f"         - Sec{section.section_number}: {section.title}")
        
        if sections.count() > 3:
            print(f"         ... and {sections.count() - 3} more")

def main():
    print("🚀 Complete UUID Fix for Database")
    print("=" * 70)
    print("This will:")
    print("  1. Expand all UUID columns from CHAR(32) to CHAR(36)")
    print("  2. Add hyphens to all UUIDs in the database")
    print("  3. Fix the 'doesn't exist' error in Django admin")
    print("=" * 70)
    print()
    
    response = input("⚠️  Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    print()
    
    try:
        # Step 1: Check current state
        issues = check_column_sizes()
        
        if issues:
            print(f"\nFound {len(issues)} columns that need fixing")
            
            # Step 2: Fix column sizes
            fix_column_sizes(issues)
            
            # Step 3: Re-check
            print(f"\n✅ Re-checking column sizes...")
            issues_after = check_column_sizes()
            
            if issues_after:
                print(f"\n⚠️  Still have {len(issues_after)} issues!")
                return
        
        # Step 4: Add hyphens
        add_hyphens_to_uuids()
        
        # Step 5: Verify
        verify_fix()
        
        print("\n" + "=" * 70)
        print("🎉 SUCCESS!")
        print("=" * 70)
        print("\n💡 Next Steps:")
        print("   1. Refresh Django admin page")
        print("   2. Click on 'Complete 10th Class Mathematics Course'")
        print("   3. You should now see all 14 chapters!")
        print("   4. Test enrollment from frontend")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
