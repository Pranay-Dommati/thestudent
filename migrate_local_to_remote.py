#!/usr/bin/env python3
"""
Migrate data from local MySQL Docker to remote Hostinger MySQL database
This script will:
1. Connect to both databases
2. Export data from local database
3. Import data to remote database
4. Verify the migration
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

from django.core.management import call_command
from django.db import connections
from courses.models import SchoolCourse, EngineeringCourse
from authentication.models import User

def check_local_data():
    """Check what data exists in the current (local) database"""
    print("🔍 Checking LOCAL database data...")
    
    school_courses = SchoolCourse.objects.all()
    engineering_courses = EngineeringCourse.objects.all()
    users = User.objects.all()
    
    print(f"\n📊 Current Database Statistics:")
    print(f"   School Courses: {school_courses.count()}")
    print(f"   Engineering Courses: {engineering_courses.count()}")
    print(f"   Users: {users.count()}")
    
    if school_courses.exists():
        print(f"\n📚 School Courses in LOCAL database:")
        for course in school_courses[:5]:  # Show first 5
            print(f"   - {course.title} ({course.class_level}/{course.subject})")
        if school_courses.count() > 5:
            print(f"   ... and {school_courses.count() - 5} more")
    
    if engineering_courses.exists():
        print(f"\n🔧 Engineering Courses in LOCAL database:")
        for course in engineering_courses[:5]:  # Show first 5
            print(f"   - {course.title}")
        if engineering_courses.count() > 5:
            print(f"   ... and {engineering_courses.count() - 5} more")
    
    return school_courses.count() > 0 or engineering_courses.count() > 0

def export_data():
    """Export data from local database using Django's dumpdata"""
    print("\n📤 Exporting data from LOCAL database...")
    
    try:
        # Export all data with UTF-8 encoding
        with open('local_data_backup.json', 'w', encoding='utf-8') as f:
            call_command('dumpdata', 
                        '--natural-foreign', 
                        '--natural-primary',
                        '--indent', '2',
                        stdout=f,
                        exclude=['contenttypes', 'auth.permission'])
        
        print("   ✅ Data exported to: local_data_backup.json")
        
        # Also create specific exports
        with open('courses_backup.json', 'w', encoding='utf-8') as f:
            call_command('dumpdata', 
                        'courses',
                        '--natural-foreign',
                        '--natural-primary', 
                        '--indent', '2',
                        stdout=f)
        
        print("   ✅ Courses exported to: courses_backup.json")
        
        with open('users_backup.json', 'w', encoding='utf-8') as f:
            call_command('dumpdata',
                        'authentication',
                        '--natural-foreign',
                        '--natural-primary',
                        '--indent', '2', 
                        stdout=f)
        
        print("   ✅ Users exported to: users_backup.json")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Export failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def import_to_remote():
    """Import data to remote database"""
    print("\n📥 Importing data to REMOTE database...")
    print("   ⚠️  Make sure your .env points to the REMOTE database!")
    
    response = input("\n   Are you ready to import? (yes/no): ")
    if response.lower() != 'yes':
        print("   ℹ️  Import cancelled")
        return False
    
    try:
        # Import all data
        call_command('loaddata', 'local_data_backup.json')
        print("   ✅ Data imported successfully!")
        
        # Verify
        school_courses = SchoolCourse.objects.all()
        engineering_courses = EngineeringCourse.objects.all()
        
        print(f"\n📊 REMOTE Database after import:")
        print(f"   School Courses: {school_courses.count()}")
        print(f"   Engineering Courses: {engineering_courses.count()}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Import failed: {e}")
        print("   💡 Tip: You may need to migrate the database first:")
        print("      python manage.py migrate")
        return False

def main():
    """Main migration workflow"""
    print("🚀 MySQL Data Migration Tool")
    print("=" * 60)
    
    # Check current database configuration
    db_config = connections['default'].settings_dict
    print(f"\n📋 Current Database Configuration:")
    print(f"   Engine: {db_config['ENGINE']}")
    print(f"   Host: {db_config['HOST']}")
    print(f"   Port: {db_config['PORT']}")
    print(f"   Database: {db_config['NAME']}")
    print(f"   User: {db_config['USER']}")
    
    print(f"\n⚠️  IMPORTANT: This script will export from the CURRENT database")
    print(f"   Make sure your .env is configured for LOCAL database first!")
    
    # Step 1: Check and export local data
    if not check_local_data():
        print("\n❌ No data found in local database!")
        print("💡 Make sure your .env points to the LOCAL MySQL database")
        return
    
    # Step 2: Export data
    if not export_data():
        print("\n❌ Export failed!")
        return
    
    # Step 3: Instructions for remote import
    print("\n" + "=" * 60)
    print("📝 Next Steps:")
    print("=" * 60)
    print("\n1️⃣  Change your .env file to point to REMOTE database:")
    print("   DB_HOST=srv1990.hstgr.io")
    print("   DB_NAME=u787111463_easylearnovadb")
    print("   DB_USER=u787111463_teamlearnova")
    print("   DB_PASSWORD=EasyLearnova@pranay.23")
    
    print("\n2️⃣  Run migrations on remote database:")
    print("   python manage.py migrate")
    
    print("\n3️⃣  Import the data:")
    print("   python manage.py loaddata local_data_backup.json")
    
    print("\n4️⃣  Or run this script again after changing .env")
    
    print("\n💡 Backup files created:")
    print("   - local_data_backup.json (all data)")
    print("   - courses_backup.json (courses only)")
    print("   - users_backup.json (users only)")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()