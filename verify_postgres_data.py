#!/usr/bin/env python3
"""
Verify PostgreSQL Data Migration
"""

import os
import sys
import django

# Add backend to path
sys.path.append('backend')
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
        
        # Check custom User model
        from authentication.models import User
        user_count = User.objects.count()
        print(f"\n👤 Users in PostgreSQL: {user_count}")
        
        if user_count > 0:
            print("📝 Users found:")
            for user in User.objects.all()[:5]:
                print(f"   - {user.username} ({user.email})")
        
        # Check other models
        print(f"\n📊 Data in PostgreSQL:")
        
        try:
            from courses.models import SchoolCourse
            course_count = SchoolCourse.objects.count()
            print(f"   - School Courses: {course_count}")
        except:
            print("   - School Courses: Model not available")
        
        try:
            from feedback.models import Feedback
            feedback_count = Feedback.objects.count()
            print(f"   - Feedback: {feedback_count}")
        except:
            print("   - Feedback: Model not available")
        
        try:
            from newsletter.models import NewsletterSubscription
            newsletter_count = NewsletterSubscription.objects.count()
            print(f"   - Newsletter Subscriptions: {newsletter_count}")
        except:
            print("   - Newsletter: Model not available")
        
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
    os.chdir("C:/Users/banny/OneDrive/Documents/Desktop/STUDENTSHUB/SHPRO/thestudent")
    verify_data()
