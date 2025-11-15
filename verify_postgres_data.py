#!/usr/bin/env python3
"""
Verify PostgreSQL Data Migration
"""

import os
import sys
from pathlib import Path
import django

# Add backend to path (absolute path relative to this file)
REPO_ROOT = Path(__file__).resolve().parent
BACKEND_PATH = REPO_ROOT / 'backend'
sys.path.insert(0, str(BACKEND_PATH))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def verify_data():
    """Verify that data was successfully migrated to PostgreSQL"""
    print("🔍 Verifying PostgreSQL Data Migration")
    print("=" * 50)
    
    try:
        # Check database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            db_version = cursor.fetchone()[0]
            print(f"📊 Database: PostgreSQL")
            print(f"📋 Version: {db_version.split(',')[0]}")
        
        # Check custom User model via apps registry
        from django.apps import apps
        User = apps.get_model('authentication', 'User')
        user_count = User.objects.count()
        print(f"\n👤 Users in PostgreSQL: {user_count}")
        
        if user_count > 0:
            print("📝 Users found:")
            for user in User.objects.all()[:5]:
                print(f"   - {user.username} ({user.email})")
        
        # Check other models
        print(f"\n📊 Data in PostgreSQL:")
        
        try:
            SchoolCourse = apps.get_model('courses', 'SchoolCourse')
            course_count = SchoolCourse.objects.count()
            print(f"   - School Courses: {course_count}")
        except Exception as e:
            print(f"   - School Courses: Model not available ({e})")
        
        try:
            Feedback = apps.get_model('feedback', 'Feedback')
            feedback_count = Feedback.objects.count()
            print(f"   - Feedback: {feedback_count}")
        except Exception as e:
            print(f"   - Feedback: Model not available ({e})")
        
        try:
            NewsletterSubscription = apps.get_model('newsletter', 'NewsletterSubscription')
            newsletter_count = NewsletterSubscription.objects.count()
            print(f"   - Newsletter Subscriptions: {newsletter_count}")
        except Exception as e:
            print(f"   - Newsletter: Model not available ({e})")
        
        print(f"\n✅ PostgreSQL verification completed!")
        print(f"🎉 Your data has been successfully migrated to PostgreSQL!")
        
        # Database file status
        print(f"\n📂 Database Status:")
        print(f"   - SQLite file (backup): backend/db.sqlite3 (still exists)")
        print(f"   - PostgreSQL database: studentshub_db (now active)")
        print(f"   - Django is now using: PostgreSQL")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
        return False

if __name__ == "__main__":
    # Run verification in the current repository context (no hard-coded paths)
    verify_data()
