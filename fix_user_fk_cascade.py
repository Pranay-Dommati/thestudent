#!/usr/bin/env python3
"""
Fix foreign key constraints for user-related tables
Add ON DELETE CASCADE to allow user deletion
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

def get_user_foreign_keys():
    """Find all foreign keys that reference authentication_user"""
    print("🔍 Finding Foreign Keys to authentication_user...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                TABLE_NAME,
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'authentication_user'
            AND REFERENCED_COLUMN_NAME IS NOT NULL
        """)
        
        fks = cursor.fetchall()
        
        print(f"Found {len(fks)} foreign key constraints:\n")
        
        for table, constraint, column, ref_column in fks:
            print(f"   📌 {table}.{column}")
            print(f"      Constraint: {constraint}")
            print(f"      References: authentication_user.{ref_column}")
            print()
        
        return fks

def check_fk_delete_rule(table, constraint):
    """Check the current DELETE_RULE for a foreign key"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DELETE_RULE
            FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
            AND CONSTRAINT_NAME = %s
            AND TABLE_NAME = %s
        """, [constraint, table])
        
        result = cursor.fetchone()
        return result[0] if result else None

def fix_user_foreign_keys(fks):
    """Drop and recreate foreign keys with ON DELETE CASCADE"""
    print(f"\n🔧 Fixing Foreign Key Constraints...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        for table, constraint, column, ref_column in fks:
            try:
                # Check current delete rule
                delete_rule = check_fk_delete_rule(table, constraint)
                
                if delete_rule == 'CASCADE':
                    print(f"   ✅ {table}.{column} already has CASCADE")
                    continue
                
                print(f"\n   🔧 Fixing {table}.{column} (current: {delete_rule})")
                
                # Drop the constraint
                cursor.execute(f"ALTER TABLE {table} DROP FOREIGN KEY {constraint}")
                print(f"      ✅ Dropped constraint: {constraint}")
                
                # Recreate with ON DELETE CASCADE
                new_constraint = f"{table}_{column}_fk_cascade"
                cursor.execute(f"""
                    ALTER TABLE {table}
                    ADD CONSTRAINT {new_constraint}
                    FOREIGN KEY ({column}) REFERENCES authentication_user({ref_column})
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
                """)
                print(f"      ✅ Created new constraint: {new_constraint} (CASCADE)")
                
            except Exception as e:
                print(f"      ❌ Error: {e}")

def verify_fix():
    """Verify that all foreign keys now have CASCADE"""
    print(f"\n✅ Verifying Fix...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                rc.TABLE_NAME,
                rc.CONSTRAINT_NAME,
                kcu.COLUMN_NAME,
                rc.DELETE_RULE,
                rc.UPDATE_RULE
            FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
            WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
            AND rc.REFERENCED_TABLE_NAME = 'authentication_user'
        """)
        
        fks = cursor.fetchall()
        
        print(f"\nForeign Key Constraints Summary:\n")
        
        issues = []
        for table, constraint, column, delete_rule, update_rule in fks:
            status = "✅" if delete_rule == 'CASCADE' else "⚠️ "
            print(f"{status} {table}.{column}")
            print(f"   Constraint: {constraint}")
            print(f"   ON DELETE {delete_rule} | ON UPDATE {update_rule}")
            print()
            
            if delete_rule != 'CASCADE':
                issues.append((table, column))
        
        if issues:
            print(f"\n⚠️  {len(issues)} constraint(s) still need fixing")
            return False
        else:
            print(f"\n✅ All foreign keys have CASCADE behavior!")
            return True

def main():
    print("🚀 User Foreign Key Cascade Fixer")
    print("=" * 70)
    print("This will update foreign keys to authentication_user table")
    print("to use ON DELETE CASCADE, allowing user deletion")
    print("=" * 70)
    print()
    
    response = input("⚠️  Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    print()
    
    try:
        # Step 1: Find all foreign keys
        fks = get_user_foreign_keys()
        
        if not fks:
            print("✅ No foreign keys found to authentication_user")
            return
        
        # Step 2: Fix them
        fix_user_foreign_keys(fks)
        
        # Step 3: Verify
        success = verify_fix()
        
        if success:
            print("\n" + "=" * 70)
            print("🎉 SUCCESS! All User Foreign Keys Fixed!")
            print("=" * 70)
            print("\n💡 What was fixed:")
            print("   ✅ All foreign keys now have ON DELETE CASCADE")
            print("   ✅ Deleting a user will now automatically delete:")
            print("      - Their ProLearning courses")
            print("      - Their course enrollments")
            print("      - Their progress tracking")
            print("      - All related user data")
            print()
            print("💡 Next Steps:")
            print("   1. Try deleting the user again from admin panel")
            print("   2. It should work without foreign key errors!")
        else:
            print("\n⚠️  Some constraints still need attention")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
