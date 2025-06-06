#!/usr/bin/env python
"""
Script to check the current state of the database
"""
import os
import sys
import django

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(backend_dir, 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import AILearningPlan
from authentication.models import User

def check_database():
    print("🔍 Database Status Check\n")
      # Check users
    user_count = User.objects.count()
    print(f"👥 Total Users: {user_count}")
    if user_count > 0:
        for user in User.objects.all()[:3]:
            print(f"   - {user.email} (ID: {user.id})")
    
    # Check learning plans
    plan_count = AILearningPlan.objects.count()
    print(f"\n📚 Total AI Learning Plans: {plan_count}")
    if plan_count > 0:
        for plan in AILearningPlan.objects.all()[:3]:
            print(f"   - {plan.title} (ID: {plan.id})")
            print(f"     User: {plan.user.email if plan.user else 'No user'}")
            print(f"     Days: {plan.days_count}, Videos: {plan.total_videos}")
    else:
        print("   No learning plans found")
    
    print(f"\n✅ Database is accessible and models are working")

if __name__ == "__main__":
    check_database()
