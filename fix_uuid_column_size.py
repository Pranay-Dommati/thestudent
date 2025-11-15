#!/usr/bin/env python3
"""
Fix UUID column size in MySQL database
The id column needs to be CHAR(36) to store full UUID with hyphens
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

def check_column_size():
    """Check current column configuration"""
    print("🔍 Checking Current Column Configuration...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # Check school course
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'courses_schoolcourse'
            AND COLUMN_NAME = 'id'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"School Course ID Column:")
            print(f"   Name: {result[0]}")
            print(f"   Data Type: {result[1]}")
            print(f"   Column Type: {result[2]}")
            print(f"   Max Length: {result[3]}")
            
            if result[3] and result[3] < 36:
                print(f"   ⚠️  WARNING: Column is too small for UUID!")
                print(f"   Required: 36 characters")
                print(f"   Current: {result[3]} characters")
                return False
            elif 'binary' in str(result[2]).lower():
                print(f"   ⚠️  WARNING: Column is BINARY, should be CHAR")
                return False
            else:
                print(f"   ✅ Column size is OK")
                return True
        
        return None

def fix_column_size():
    """Fix the column size to accommodate full UUID"""
    print("\n🔧 Fixing Column Size...")
    print("=" * 70)
    
    response = input("\n⚠️  This will modify the database structure. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("   ℹ️  Operation cancelled")
        return False
    
    with connection.cursor() as cursor:
        try:
            print("\n📋 Step 1: Dropping foreign key constraints...")
            
            # Drop foreign keys from related tables
            try:
                cursor.execute("""
                    ALTER TABLE courses_coursechapter 
                    DROP FOREIGN KEY courses_coursechapte_school_course_id_a1fdf00b_fk_courses_s
                """)
                print("   ✅ Dropped course chapter foreign key")
            except Exception as e:
                print(f"   ⚠️  Could not drop chapter FK: {e}")
            
            try:
                cursor.execute("""
                    ALTER TABLE courses_coursesection 
                    DROP FOREIGN KEY courses_coursesectio_engineering_course_i_0e8c2e25_fk_courses_e
                """)
                print("   ✅ Dropped course section foreign key")
            except Exception as e:
                print(f"   ⚠️  Could not drop section FK: {e}")
            
            print("\n📋 Step 2: Modifying column sizes...")
            
            # Fix school course table
            print("\n📚 Fixing School Course table...")
            cursor.execute("""
                ALTER TABLE courses_schoolcourse 
                MODIFY COLUMN id CHAR(36) NOT NULL
            """)
            print("   ✅ School Course fixed")
            
            # Fix engineering course table
            print("\n🔧 Fixing Engineering Course table...")
            cursor.execute("""
                ALTER TABLE courses_engineeringcourse 
                MODIFY COLUMN id CHAR(36) NOT NULL
            """)
            print("   ✅ Engineering Course fixed")
            
            # Fix related tables with foreign keys
            print("\n🔗 Fixing Related Tables...")
            
            # Course chapters
            cursor.execute("""
                ALTER TABLE courses_coursechapter 
                MODIFY COLUMN school_course_id CHAR(36)
            """)
            print("   ✅ Course Chapters fixed")
            
            # Course sections  
            cursor.execute("""
                ALTER TABLE courses_coursesection 
                MODIFY COLUMN engineering_course_id CHAR(36)
            """)
            print("   ✅ Course Sections fixed")
            
            # User started courses
            try:
                cursor.execute("""
                    ALTER TABLE courses_userstartedpredefinedcourse 
                    MODIFY COLUMN school_course_id CHAR(36)
                """)
                cursor.execute("""
                    ALTER TABLE courses_userstartedpredefinedcourse 
                    MODIFY COLUMN engineering_course_id CHAR(36)
                """)
                print("   ✅ User Started Courses fixed")
            except Exception as e:
                print(f"   ⚠️  Could not fix user started courses: {e}")
            
            print("\n📋 Step 3: Re-creating foreign key constraints...")
            
            # Re-create foreign keys
            cursor.execute("""
                ALTER TABLE courses_coursechapter 
                ADD CONSTRAINT courses_coursechapte_school_course_id_a1fdf00b_fk_courses_s
                FOREIGN KEY (school_course_id) 
                REFERENCES courses_schoolcourse(id)
                ON DELETE CASCADE
            """)
            print("   ✅ Course chapter foreign key recreated")
            
            cursor.execute("""
                ALTER TABLE courses_coursesection 
                ADD CONSTRAINT courses_coursesectio_engineering_course_i_0e8c2e25_fk_courses_e
                FOREIGN KEY (engineering_course_id) 
                REFERENCES courses_engineeringcourse(id)
                ON DELETE CASCADE
            """)
            print("   ✅ Course section foreign key recreated")
            
            print("\n✅ All columns fixed successfully!")
            return True
            
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    print("🚀 MySQL UUID Column Fix Tool")
    print("=" * 70)
    print()
    
    # Check current configuration
    is_ok = check_column_size()
    
    if is_ok is False:
        # Fix needed
        fix_column_size()
        
        # Verify fix
        print("\n🔍 Verifying Fix...")
        check_column_size()
    elif is_ok is True:
        print("\n✅ No fix needed - column size is already correct!")
    
    print("\n" + "=" * 70)
    print("💡 Next Step: Run fix_orphaned_courses.py to recreate the courses")
    print("=" * 70)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()