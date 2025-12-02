import os
import sys
import django
from django.db import connection

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def inspect_columns(table_name):
    print(f"\n--- Inspecting table: {table_name} ---")
    with connection.cursor() as cursor:
        try:
            cursor.execute(f"DESCRIBE {table_name};")
            columns = cursor.fetchall()
            print(f"{'Field':<20} {'Type':<20} {'Null':<5} {'Key':<5} {'Default':<20} {'Extra':<20}")
            print("-" * 100)
            for col in columns:
                # field, type, null, key, default, extra
                print(f"{col[0]:<20} {col[1]:<20} {col[2]:<5} {col[3]:<5} {str(col[4]):<20} {col[5]:<20}")
        except Exception as e:
            print(f"Error inspecting {table_name}: {e}")

if __name__ == "__main__":
    inspect_columns('courses_coursechapter')
    inspect_columns('courses_coursesection')
