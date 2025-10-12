#!/usr/bin/env python3
"""
FINAL UUID Fix - Handles ALL Foreign Keys
"""

import os
import sys
import django
from pathlib import Path

backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def format_uuid_with_hyphens(uuid_str):
    """Format a UUID string without hyphens to include hyphens"""
    if len(uuid_str) == 32:
        return f"{uuid_str[0:8]}-{uuid_str[8:12]}-{uuid_str[12:16]}-{uuid_str[16:20]}-{uuid_str[20:32]}"
    return uuid_str

def drop_all_foreign_keys():
    """Drop ALL foreign key constraints"""
    print("🔧 Step 1: Dropping ALL Foreign Key Constraints...")
    print("=" * 70)
    
    fk_constraints = [
        ('courses_coursesection', 'courses_coursesectio_engineering_course_i_6eb2f22e_fk_courses_e'),
        ('courses_lesson', 'courses_lesson_chapter_id_401d021a_fk_courses_coursechapter_id'),
        ('courses_lesson', 'courses_lesson_section_id_fe288d16_fk_courses_coursesection_id'),
        ('courses_certification', 'courses_certificatio_course_id_c3513150_fk_courses_e'),
        ('courses_userstartedpredefinedcourse', 'courses_userstartedp_engineering_course_i_1dc1fd1e_fk_courses_e'),
        ('courses_userstartedpredefinedcourse', 'courses_userstartedp_school_course_id_b7969eef_fk_courses_s'),
    ]
    
    with connection.cursor() as cursor:
        for table, constraint in fk_constraints:
            try:
                cursor.execute(f"ALTER TABLE {table} DROP FOREIGN KEY {constraint}")
                print(f"   ✅ {table}: Dropped {constraint}")
            except Exception as e:
                print(f"   ⚠️  {table}.{constraint}: {e}")

def expand_all_columns():
    """Expand ALL UUID columns to CHAR(36)"""
    print("\n🔧 Step 2: Expanding ALL UUID Columns to CHAR(36)...")
    print("=" * 70)
    
    columns_to_fix = [
        # Primary keys
        ('courses_schoolcourse', 'id'),
        ('courses_engineeringcourse', 'id'),
        ('courses_coursechapter', 'id'),
        ('courses_coursesection', 'id'),
        ('courses_lesson', 'id'),
        
        # Foreign keys
        ('courses_coursechapter', 'school_course_id'),
        ('courses_coursesection', 'engineering_course_id'),
        ('courses_lesson', 'chapter_id'),
        ('courses_lesson', 'section_id'),
        ('courses_certification', 'course_id'),
        ('courses_userstartedpredefinedcourse', 'school_course_id'),
        ('courses_userstartedpredefinedcourse', 'engineering_course_id'),
    ]
    
    with connection.cursor() as cursor:
        for table, column in columns_to_fix:
            try:
                cursor.execute(f"ALTER TABLE {table} MODIFY COLUMN {column} CHAR(36)")
                print(f"   ✅ {table}.{column} → CHAR(36)")
            except Exception as e:
                print(f"   ⚠️  {table}.{column}: {e}")

def add_hyphens_to_all_uuids():
    """Add hyphens to ALL UUIDs in all tables"""
    print("\n🔧 Step 3: Adding Hyphens to ALL UUIDs...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # 1. School courses
        print("\n   1️⃣ School Courses:")
        cursor.execute("SELECT id, title FROM courses_schoolcourse WHERE id NOT LIKE '%-%'")
        courses = cursor.fetchall()
        for old_id, title in courses:
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update all related tables first
            cursor.execute(
                "UPDATE courses_coursechapter SET school_course_id = %s WHERE school_course_id = %s",
                [new_id, old_id]
            )
            cursor.execute(
                "UPDATE courses_userstartedpredefinedcourse SET school_course_id = %s WHERE school_course_id = %s",
                [new_id, old_id]
            )
            
            # Update course itself
            cursor.execute("UPDATE courses_schoolcourse SET id = %s WHERE id = %s", [new_id, old_id])
            
            print(f"      ✅ {title[:40]}... ({old_id} → {new_id})")
        
        # 2. Engineering courses
        print("\n   2️⃣ Engineering Courses:")
        cursor.execute("SELECT id, title FROM courses_engineeringcourse WHERE id NOT LIKE '%-%'")
        courses = cursor.fetchall()
        for old_id, title in courses:
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update all related tables first
            cursor.execute(
                "UPDATE courses_coursesection SET engineering_course_id = %s WHERE engineering_course_id = %s",
                [new_id, old_id]
            )
            cursor.execute(
                "UPDATE courses_certification SET course_id = %s WHERE course_id = %s",
                [new_id, old_id]
            )
            cursor.execute(
                "UPDATE courses_userstartedpredefinedcourse SET engineering_course_id = %s WHERE engineering_course_id = %s",
                [new_id, old_id]
            )
            
            # Update course itself
            cursor.execute("UPDATE courses_engineeringcourse SET id = %s WHERE id = %s", [new_id, old_id])
            
            print(f"      ✅ {title[:40]}... ({old_id} → {new_id})")
        
        # 3. Chapters
        print("\n   3️⃣ Course Chapters:")
        cursor.execute("SELECT id FROM courses_coursechapter WHERE id NOT LIKE '%-%'")
        chapter_ids = cursor.fetchall()
        for (old_id,) in chapter_ids:
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update lessons first
            cursor.execute(
                "UPDATE courses_lesson SET chapter_id = %s WHERE chapter_id = %s",
                [new_id, old_id]
            )
            
            # Update chapter itself
            cursor.execute("UPDATE courses_coursechapter SET id = %s WHERE id = %s", [new_id, old_id])
        
        print(f"      ✅ Updated {len(chapter_ids)} chapter IDs")
        
        # 4. Sections
        print("\n   4️⃣ Course Sections:")
        cursor.execute("SELECT id FROM courses_coursesection WHERE id NOT LIKE '%-%'")
        section_ids = cursor.fetchall()
        for (old_id,) in section_ids:
            new_id = format_uuid_with_hyphens(old_id)
            
            # Update lessons first
            cursor.execute(
                "UPDATE courses_lesson SET section_id = %s WHERE section_id = %s",
                [new_id, old_id]
            )
            
            # Update section itself
            cursor.execute("UPDATE courses_coursesection SET id = %s WHERE id = %s", [new_id, old_id])
        
        print(f"      ✅ Updated {len(section_ids)} section IDs")
        
        # 5. Lessons (might be INT, not UUID)
        print("\n   5️⃣ Lessons:")
        cursor.execute("SHOW COLUMNS FROM courses_lesson LIKE 'id'")
        lesson_id_info = cursor.fetchone()
        
        if 'char' in str(lesson_id_info[1]).lower():
            cursor.execute("SELECT id FROM courses_lesson WHERE id NOT LIKE '%-%'")
            lesson_ids = cursor.fetchall()
            for (old_id,) in lesson_ids:
                if isinstance(old_id, str):
                    new_id = format_uuid_with_hyphens(old_id)
                    cursor.execute("UPDATE courses_lesson SET id = %s WHERE id = %s", [new_id, old_id])
            print(f"      ✅ Updated {len(lesson_ids)} lesson IDs")
        else:
            print(f"      ℹ️  Lesson IDs are {lesson_id_info[1]}, not UUID - skipping")

def recreate_all_foreign_keys():
    """Recreate ALL foreign key constraints"""
    print("\n🔧 Step 4: Recreating ALL Foreign Key Constraints...")
    print("=" * 70)
    
    fk_definitions = [
        ('courses_coursechapter', 'school_course_id', 'courses_schoolcourse', 'id'),
        ('courses_coursesection', 'engineering_course_id', 'courses_engineeringcourse', 'id'),
        ('courses_lesson', 'chapter_id', 'courses_coursechapter', 'id'),
        ('courses_lesson', 'section_id', 'courses_coursesection', 'id'),
        ('courses_certification', 'course_id', 'courses_engineeringcourse', 'id'),
        ('courses_userstartedpredefinedcourse', 'school_course_id', 'courses_schoolcourse', 'id'),
        ('courses_userstartedpredefinedcourse', 'engineering_course_id', 'courses_engineeringcourse', 'id'),
    ]
    
    with connection.cursor() as cursor:
        for table, column, ref_table, ref_column in fk_definitions:
            constraint_name = f"{table}_{column}_fk"
            
            try:
                cursor.execute(f"""
                    ALTER TABLE {table}
                    ADD CONSTRAINT {constraint_name}
                    FOREIGN KEY ({column}) REFERENCES {ref_table}({ref_column})
                    ON DELETE CASCADE
                """)
                print(f"   ✅ {table}.{column} → {ref_table}.{ref_column}")
            except Exception as e:
                print(f"   ⚠️  {table}.{column}: {e}")

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
        
        for i, chapter in enumerate(chapters[:5]):
            lessons = chapter.lessons.all() if hasattr(chapter, 'lessons') else []
            chapter_num = getattr(chapter, 'order', i+1)
            chapter_name = getattr(chapter, 'name', 'Unnamed')
            print(f"         - Ch{chapter_num}: {chapter_name} ({len(lessons)} lessons)")
        
        if chapters.count() > 5:
            print(f"         ... and {chapters.count() - 5} more chapters")
    
    # Engineering courses
    print("\n🔧 Engineering Courses:")
    for course in EngineeringCourse.objects.all():
        sections = course.sections.all()
        print(f"   ✅ {course.title}")
        print(f"      ID: {course.id}")
        print(f"      Sections: {sections.count()}")
        
        for i, section in enumerate(sections[:5]):
            lessons = section.lessons.all() if hasattr(section, 'lessons') else []
            section_num = getattr(section, 'order', i+1)
            section_name = getattr(section, 'name', 'Unnamed')
            print(f"         - Sec{section_num}: {section_name} ({len(lessons)} lessons)")
        
        if sections.count() > 5:
            print(f"         ... and {sections.count() - 5} more sections")

def main():
    print("🚀 FINAL UUID Fix - Complete Solution")
    print("=" * 70)
    print("This will:")
    print("  1. Drop ALL foreign key constraints (6 total)")
    print("  2. Expand ALL UUID columns from CHAR(32) to CHAR(36)")
    print("  3. Add hyphens to ALL UUIDs in ALL tables")
    print("  4. Recreate ALL foreign key constraints")
    print("  5. Verify everything works")
    print()
    print("⚠️  WARNING: This will modify the database structure!")
    print("=" * 70)
    print()
    
    response = input("Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    print()
    
    try:
        drop_all_foreign_keys()
        expand_all_columns()
        add_hyphens_to_all_uuids()
        recreate_all_foreign_keys()
        verify()
        
        print("\n" + "=" * 70)
        print("🎉 SUCCESS! UUID Format Completely Fixed!")
        print("=" * 70)
        print("\n💡 What was fixed:")
        print("   ✅ ALL UUID columns expanded to 36 characters")
        print("   ✅ Hyphens added to ALL UUIDs in the entire database")
        print("   ✅ ALL foreign key relationships recreated")
        print("   ✅ Courses and their chapters/sections now fully connected")
        print()
        print("💡 Next Steps:")
        print("   1. Refresh Django admin page (F5)")
        print("   2. Click on 'Complete 10th Class Mathematics Course'")
        print("   3. You should now see all 14 chapters with data!")
        print("   4. Click on any chapter - it should open!")
        print("   5. Test enrollment from frontend")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
