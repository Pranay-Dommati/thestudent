#!/usr/bin/env python3
"""
Find all foreign key constraints related to UUID columns
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

def find_all_foreign_keys():
    """Find all foreign key constraints that reference UUID columns"""
    print("🔍 Finding All Foreign Key Constraints...")
    print("=" * 70)
    
    with connection.cursor() as cursor:
        # Find all FKs that reference school courses
        cursor.execute("""
            SELECT 
                TABLE_NAME,
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND (
                REFERENCED_TABLE_NAME = 'courses_schoolcourse' 
                OR REFERENCED_TABLE_NAME = 'courses_engineeringcourse'
                OR REFERENCED_TABLE_NAME = 'courses_coursechapter'
                OR REFERENCED_TABLE_NAME = 'courses_coursesection'
            )
            AND REFERENCED_COLUMN_NAME IS NOT NULL
        """)
        
        fks = cursor.fetchall()
        
        print(f"Found {len(fks)} foreign key constraints:\n")
        
        for table, constraint, column, ref_table, ref_column in fks:
            print(f"   📌 {table}.{column}")
            print(f"      Constraint: {constraint}")
            print(f"      References: {ref_table}.{ref_column}")
            print()
        
        return fks

if __name__ == "__main__":
    find_all_foreign_keys()
