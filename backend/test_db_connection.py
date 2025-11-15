"""
Test MySQL database connection
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection
from django.conf import settings

print("="*60)
print("DATABASE CONNECTION TEST")
print("="*60)

try:
    # Test connection
    connection.ensure_connection()
    
    print("\n✅ Database connection SUCCESSFUL!")
    print(f"\nDatabase Settings:")
    print(f"  Engine: {connection.settings_dict['ENGINE']}")
    print(f"  Name: {connection.settings_dict['NAME']}")
    print(f"  Host: {connection.settings_dict['HOST']}")
    print(f"  Port: {connection.settings_dict['PORT']}")
    print(f"  User: {connection.settings_dict['USER']}")
    
    # Test query
    print("\n🔍 Testing database query...")
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"  MySQL Version: {version[0]}")
    
    # Test models
    print("\n📊 Testing model queries...")
    from courses.models import EngineeringCourse, SchoolCourse
    
    eng_count = EngineeringCourse.objects.count()
    school_count = SchoolCourse.objects.count()
    
    print(f"  Engineering Courses: {eng_count}")
    print(f"  School Courses: {school_count}")
    
    if eng_count > 0:
        course = EngineeringCourse.objects.first()
        print(f"\n  Sample Course:")
        print(f"    ID: {course.id}")
        print(f"    Title: {course.title}")
        print(f"    Category: {course.category}")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    
except Exception as e:
    print(f"\n❌ Database connection FAILED!")
    print(f"\nError: {str(e)}")
    print(f"\nError Type: {type(e).__name__}")
    
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()
    
    print("\n" + "="*60)
    print("❌ TESTS FAILED - Check database configuration")
    print("="*60)
    
    # Print environment variables
    print("\n🔍 Environment Variables:")
    print(f"  DB_ENGINE: {os.getenv('DB_ENGINE')}")
    print(f"  DB_HOST: {os.getenv('DB_HOST')}")
    print(f"  DB_PORT: {os.getenv('DB_PORT')}")
    print(f"  DB_NAME: {os.getenv('DB_NAME')}")
    print(f"  DB_USER: {os.getenv('DB_USER')}")
    print(f"  DB_PASSWORD: {'***' if os.getenv('DB_PASSWORD') else 'NOT SET'}")
