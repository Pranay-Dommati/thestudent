#!/usr/bin/env python3
"""
Fix UUID column sizes for ProLearning tables in MySQL
Sets id and FK columns to CHAR(36), temporarily disabling FK checks.
"""
import os
import sys
import django
from pathlib import Path
from django.db import connection

# Setup Django
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

TABLES = [
    ('courses_prolearningcourse', ['id']),
    ('courses_prolearningtopic', ['id', 'course_id']),
    ('courses_prolearningvideo', ['id', 'topic_id']),
    ('courses_prolearningquizquestion', ['id', 'topic_id']),
    ('courses_prolearningresource', ['id', 'topic_id']),
]


def get_col_info(table, column):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s
            """,
            [table, column],
        )
        return cursor.fetchone()


def check_tables():
    print("🔍 Checking ProLearning table column sizes...\n")
    all_ok = True
    for table, cols in TABLES:
        for col in cols:
            info = get_col_info(table, col)
            if not info:
                print(f"⚠️  {table}.{col}: Not found")
                all_ok = False
                continue
            data_type, col_type, max_len = info
            print(f"{table}.{col}: type={data_type}, col_type={col_type}, max_len={max_len}")
            if data_type.lower() in ('char', 'varchar'):
                if not max_len or max_len < 36:
                    print(f"   ⚠️  Needs fix to CHAR(36)")
                    all_ok = False
            elif data_type.lower() == 'binary':
                print(f"   ⚠️  Binary type; should be CHAR(36)")
                all_ok = False
            else:
                # Could be other types (e.g., int) which is wrong
                print(f"   ⚠️  Unexpected type; should be CHAR(36)")
                all_ok = False
    return all_ok


def fix_tables():
    print("\n🔧 Applying fixes ...\n")
    with connection.cursor() as cursor:
        # Discover FK constraints to drop
        print("Finding foreign key constraints to drop...")
        cursor.execute(
            """
            SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND REFERENCED_TABLE_NAME IN ('courses_prolearningcourse','courses_prolearningtopic')
            """
        )
        fks = cursor.fetchall()
        for name, table, col, ref_table, ref_col in fks:
            print(f"Will drop FK {name} on {table}.{col} -> {ref_table}.{ref_col}")

        # Drop FKs
        for name, table, col, ref_table, ref_col in fks:
            try:
                print(f"Dropping FK {name} on {table}...")
                cursor.execute(f"ALTER TABLE {table} DROP FOREIGN KEY {name}")
                print("   ✅ Dropped")
            except Exception as e:
                print(f"   ❌ Failed to drop {name}: {e}")

        # Alter parent and child columns to CHAR(36)
        def alter(table, col):
            try:
                print(f"-> Altering {table}.{col} to CHAR(36) NOT NULL")
                cursor.execute(f"ALTER TABLE {table} MODIFY COLUMN {col} CHAR(36) NOT NULL")
                print(f"   ✅ {table}.{col} fixed")
            except Exception as e:
                print(f"   ❌ Failed to alter {table}.{col}: {e}")

        # Parents
        alter('courses_prolearningcourse', 'id')
        alter('courses_prolearningtopic', 'id')
        # Children referencing parents
        alter('courses_prolearningtopic', 'course_id')
        alter('courses_prolearningvideo', 'topic_id')
        alter('courses_prolearningquizquestion', 'topic_id')
        alter('courses_prolearningresource', 'topic_id')

        # Recreate FKs
        print("\nRe-creating foreign keys...")
        for name, table, col, ref_table, ref_col in fks:
            try:
                print(f"Adding FK {name} on {table}.{col} -> {ref_table}.{ref_col}")
                cursor.execute(
                    f"ALTER TABLE {table} ADD CONSTRAINT {name} FOREIGN KEY ({col}) REFERENCES {ref_table}({ref_col}) ON DELETE CASCADE"
                )
                print("   ✅ Added")
            except Exception as e:
                print(f"   ❌ Failed to add {name}: {e}")


def main():
    ok = check_tables()
    if ok:
        print("\n✅ All ProLearning columns already compatible with UUID CHAR(36). Nothing to do.")
        return
    ans = 'yes'
    # For automated run, proceed without prompt
    print("\nProceeding to fix columns to CHAR(36)...")
    fix_tables()
    print("\n🔍 Verifying after fix...\n")
    check_tables()
    print("\n✅ Done.")

if __name__ == '__main__':
    main()
