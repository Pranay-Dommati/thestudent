#!/usr/bin/env python3
"""
Diagnose and fix course relationship issues in the database
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

from courses.models import (
    SchoolCourse, EngineeringCourse,
    CourseChapter, CourseSection,
    Lesson
)
from django.db import connection

def diagnose_school_course():
    """Diagnose the school course relationship issue"""
    print("🔍 Diagnosing School Course Relationships...")
    print("=" * 70)
    
    # Check if course exists
    course_id = "95aff5e7-89b4-4aaf-8b05-eedc816a501b"
    
    # Direct database query to check if row exists
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, title, class_level, subject FROM courses_schoolcourse WHERE id = %s",
            [course_id]
        )
        row = cursor.fetchone()
        
        if row:
            print(f"✅ Course EXISTS in database (raw query)")
            print(f"   ID: {row[0]}")
            print(f"   Title: {row[1]}")
            print(f"   Class: {row[2]}")
            print(f"   Subject: {row[3]}")
        else:
            print(f"❌ Course NOT FOUND in database (raw query)")
            return None
    
    # Try to get via Django ORM
    print(f"\n🔍 Checking Django ORM access...")
    try:
        course = SchoolCourse.objects.get(id=course_id)
        print(f"✅ Course accessible via ORM")
        print(f"   Title: {course.title}")
        print(f"   PK Type: {type(course.pk)}")
        print(f"   PK Value: {course.pk}")
        return course
    except SchoolCourse.DoesNotExist:
        print(f"❌ Course NOT accessible via ORM (DoesNotExist)")
        return None
    except Exception as e:
        print(f"❌ ORM Error: {e}")
        return None

def check_chapters():
    """Check course chapters"""
    print(f"\n🔍 Checking Course Chapters...")
    print("=" * 70)
    
    # Check all chapters
    chapters = CourseChapter.objects.all()
    print(f"Total Chapters in database: {chapters.count()}")
    
    if chapters.exists():
        print(f"\n📚 Sample Chapters:")
        for chapter in chapters[:5]:
            print(f"   - {chapter.name}")
            print(f"     School Course ID: {chapter.school_course_id}")
            print(f"     School Course: {chapter.school_course}")
            
            # Try to access the related course
            try:
                if chapter.school_course:
                    print(f"     ✅ Can access related course: {chapter.school_course.title}")
                else:
                    print(f"     ⚠️  No related course")
            except Exception as e:
                print(f"     ❌ Error accessing related course: {e}")
            print()

def check_foreign_keys():
    """Check foreign key constraints"""
    print(f"\n🔍 Checking Foreign Key Relationships...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # Check if foreign keys exist
        cursor.execute("""
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'courses_schoolcourse'
        """)
        
        fks = cursor.fetchall()
        if fks:
            print(f"Found {len(fks)} foreign keys to courses_schoolcourse:")
            for fk in fks:
                print(f"   {fk[0]}.{fk[1]} -> {fk[3]}.{fk[4]} ({fk[2]})")
        else:
            print("❌ No foreign keys found!")

def check_uuid_field_type():
    """Check if UUID field is properly configured"""
    print(f"\n🔍 Checking UUID Field Configuration...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'courses_schoolcourse'
            AND COLUMN_NAME = 'id'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"ID Field Configuration:")
            print(f"   Column: {result[0]}")
            print(f"   Data Type: {result[1]}")
            print(f"   Column Type: {result[2]}")
            print(f"   Max Length: {result[3]}")
            
            # Check chapters foreign key
            cursor.execute("""
                SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'courses_coursechapter'
                AND COLUMN_NAME = 'school_course_id'
            """)
            
            result2 = cursor.fetchone()
            if result2:
                print(f"\nChapter Foreign Key Configuration:")
                print(f"   Column: {result2[0]}")
                print(f"   Data Type: {result2[1]}")
                print(f"   Column Type: {result2[2]}")
                print(f"   Max Length: {result2[3]}")
                
                if result[1] != result2[1]:
                    print(f"\n⚠️  WARNING: Data type mismatch!")
                    print(f"   Course ID: {result[1]}")
                    print(f"   Foreign Key: {result2[1]}")

def fix_relationship_issue():
    """Attempt to fix the relationship issue"""
    print(f"\n🔧 Attempting to Fix Relationship Issues...")
    print("=" * 70)
    
    course_id = "95aff5e7-89b4-4aaf-8b05-eedc816a501b"
    
    # Check if it's a UUID vs string issue
    try:
        import uuid
        uuid_id = uuid.UUID(course_id)
        print(f"✅ ID is valid UUID: {uuid_id}")
        
        # Try querying with UUID object
        try:
            course = SchoolCourse.objects.get(pk=uuid_id)
            print(f"✅ Found course using UUID object: {course.title}")
            return True
        except SchoolCourse.DoesNotExist:
            print(f"❌ Course not found with UUID object")
            
        # Try querying with string
        try:
            course = SchoolCourse.objects.get(pk=str(uuid_id))
            print(f"✅ Found course using UUID string: {course.title}")
            return True
        except SchoolCourse.DoesNotExist:
            print(f"❌ Course not found with UUID string")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 Course Relationship Diagnostic Tool")
    print("=" * 70)
    print()
    
    # Step 1: Diagnose school course
    course = diagnose_school_course()
    
    # Step 2: Check chapters
    check_chapters()
    
    # Step 3: Check foreign keys
    check_foreign_keys()
    
    # Step 4: Check UUID configuration
    check_uuid_field_type()
    
    # Step 5: Try to fix
    fix_relationship_issue()
    
    print("\n" + "=" * 70)
    print("📋 Diagnostic Complete")
    print("=" * 70)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()