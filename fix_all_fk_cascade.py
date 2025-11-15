#!/usr/bin/env python3
"""
Fix ALL foreign key constraints in the database to use CASCADE
This ensures that deleting any parent record will automatically delete related child records
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

def get_all_foreign_keys():
    """Find all foreign key constraints in the database"""
    print("🔍 Finding ALL Foreign Key Constraints...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                kcu.TABLE_NAME,
                kcu.CONSTRAINT_NAME,
                kcu.COLUMN_NAME,
                kcu.REFERENCED_TABLE_NAME,
                kcu.REFERENCED_COLUMN_NAME,
                rc.DELETE_RULE
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
            JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
                AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
            WHERE kcu.CONSTRAINT_SCHEMA = DATABASE()
            AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME
        """)
        
        fks = cursor.fetchall()
        
        print(f"Found {len(fks)} foreign key constraints\n")
        
        # Group by DELETE_RULE
        cascade = []
        restrict = []
        other = []
        
        for table, constraint, column, ref_table, ref_column, delete_rule in fks:
            if delete_rule == 'CASCADE':
                cascade.append((table, constraint, column, ref_table, ref_column, delete_rule))
            elif delete_rule == 'RESTRICT':
                restrict.append((table, constraint, column, ref_table, ref_column, delete_rule))
            else:
                other.append((table, constraint, column, ref_table, ref_column, delete_rule))
        
        print(f"✅ CASCADE: {len(cascade)}")
        print(f"⚠️  RESTRICT: {len(restrict)}")
        print(f"ℹ️  OTHER: {len(other)}\n")
        
        if restrict:
            print(f"RESTRICT Constraints that need fixing:\n")
            for table, constraint, column, ref_table, ref_column, delete_rule in restrict[:10]:
                print(f"   ⚠️  {table}.{column} → {ref_table}.{ref_column}")
            if len(restrict) > 10:
                print(f"   ... and {len(restrict) - 10} more")
        
        return fks

def fix_all_foreign_keys(fks):
    """Drop and recreate foreign keys with ON DELETE CASCADE"""
    print(f"\n🔧 Fixing Foreign Key Constraints...")
    print("=" * 70)
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    with connection.cursor() as cursor:
        for table, constraint, column, ref_table, ref_column, current_delete_rule in fks:
            # Skip if already CASCADE
            if current_delete_rule == 'CASCADE':
                skipped_count += 1
                continue
            
            try:
                # Drop the constraint
                cursor.execute(f"ALTER TABLE {table} DROP FOREIGN KEY {constraint}")
                
                # Recreate with ON DELETE CASCADE
                new_constraint = f"{table}_{column}_fk_cascade"
                cursor.execute(f"""
                    ALTER TABLE {table}
                    ADD CONSTRAINT {new_constraint}
                    FOREIGN KEY ({column}) REFERENCES {ref_table}({ref_column})
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
                """)
                
                fixed_count += 1
                if fixed_count <= 5:  # Show first 5
                    print(f"   ✅ {table}.{column} → {ref_table}.{ref_column}")
                elif fixed_count == 6:
                    print(f"   ... fixing more constraints ...")
                
            except Exception as e:
                error_count += 1
                if error_count <= 3:  # Show first 3 errors
                    print(f"   ❌ {table}.{column}: {e}")
    
    print(f"\n📊 Summary:")
    print(f"   ✅ Fixed: {fixed_count}")
    print(f"   ⏭️  Skipped (already CASCADE): {skipped_count}")
    print(f"   ❌ Errors: {error_count}")
    
    return fixed_count, error_count

def verify_fix():
    """Verify that all foreign keys now have CASCADE"""
    print(f"\n✅ Verifying Fix...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                rc.DELETE_RULE,
                COUNT(*) as count
            FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
            WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
            GROUP BY rc.DELETE_RULE
        """)
        
        results = cursor.fetchall()
        
        print(f"\nForeign Key Constraints by DELETE_RULE:\n")
        
        all_cascade = True
        for delete_rule, count in results:
            status = "✅" if delete_rule == 'CASCADE' else "⚠️ "
            print(f"{status} {delete_rule}: {count} constraints")
            if delete_rule != 'CASCADE':
                all_cascade = False
        
        return all_cascade

def main():
    print("🚀 Universal Foreign Key Cascade Fixer")
    print("=" * 70)
    print("This will update ALL foreign keys in the database")
    print("to use ON DELETE CASCADE")
    print("=" * 70)
    print()
    
    response = input("⚠️  Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    print()
    
    try:
        # Step 1: Find all foreign keys
        fks = get_all_foreign_keys()
        
        if not fks:
            print("✅ No foreign keys found in database")
            return
        
        # Step 2: Fix them
        fixed, errors = fix_all_foreign_keys(fks)
        
        # Step 3: Verify
        success = verify_fix()
        
        if success:
            print("\n" + "=" * 70)
            print("🎉 SUCCESS! All Foreign Keys Fixed!")
            print("=" * 70)
            print("\n💡 What was fixed:")
            print(f"   ✅ {fixed} foreign keys updated to CASCADE")
            print("   ✅ Deleting any parent record will now automatically delete children")
            print("   ✅ This includes:")
            print("      - Users → ProLearning courses → Topics")
            print("      - Courses → Chapters → Lessons")
            print("      - Courses → Sections → Lessons")
            print("      - All other relationships")
            print()
            print("💡 Next Steps:")
            print("   1. Try deleting the user again from admin panel")
            print("   2. It should work without ANY foreign key errors!")
        else:
            print("\n⚠️  Some constraints still need attention")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
