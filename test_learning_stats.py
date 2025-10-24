#!/usr/bin/env python
"""
Quick test script to verify LearningActivity model and get_learning_stats view work correctly
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import LearningActivity
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

print("=" * 60)
print("Testing LearningActivity Model Methods")
print("=" * 60)

# Get or create a test user
try:
    user = User.objects.first()
    if not user:
        print("❌ No users found in database. Please create a user first.")
        sys.exit(1)
    
    print(f"✅ Testing with user: {user.username} (ID: {user.id})")
    print()
    
    # Test 1: get_weekly_hours
    print("Test 1: get_weekly_hours()")
    try:
        weekly_hours = LearningActivity.get_weekly_hours(user)
        print(f"  ✅ Weekly hours: {weekly_hours}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test 2: get_current_streak
    print("Test 2: get_current_streak()")
    try:
        streak = LearningActivity.get_current_streak(user)
        print(f"  ✅ Current streak: {streak} days")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test 3: Get today's activity
    print("Test 3: Get today's activity")
    try:
        today = timezone.now().date()
        today_activity = LearningActivity.objects.filter(user=user, date=today).first()
        if today_activity:
            print(f"  ✅ Today's activity found:")
            print(f"     - Minutes: {today_activity.time_spent_minutes}")
            print(f"     - Hours: {today_activity.time_spent_hours}")
            print(f"     - Sessions: {today_activity.sessions_count}")
        else:
            print(f"  ℹ️  No activity recorded for today")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test 4: Weekly breakdown
    print("Test 4: Weekly breakdown")
    try:
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        week_activities = LearningActivity.objects.filter(
            user=user,
            date__gte=start_of_week,
            date__lte=today
        ).order_by('date')
        
        print(f"  ✅ Activities this week: {week_activities.count()}")
        for activity in week_activities:
            print(f"     - {activity.date.strftime('%A, %b %d')}: {activity.time_spent_hours}h ({activity.sessions_count} sessions)")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test 5: Simulate the view logic
    print("Test 5: Simulating get_learning_stats view logic")
    try:
        weekly_hours = LearningActivity.get_weekly_hours(user)
        current_streak = LearningActivity.get_current_streak(user)
        
        today = timezone.now().date()
        try:
            today_activity = LearningActivity.objects.get(user=user, date=today)
            today_minutes = today_activity.time_spent_minutes
            today_hours = today_activity.time_spent_hours
            today_sessions = today_activity.sessions_count
        except LearningActivity.DoesNotExist:
            today_minutes = 0
            today_hours = 0
            today_sessions = 0
        
        start_of_week = today - timedelta(days=today.weekday())
        week_activities = LearningActivity.objects.filter(
            user=user,
            date__gte=start_of_week,
            date__lte=today
        ).order_by('date')
        
        daily_breakdown = []
        for i in range(7):
            check_date = start_of_week + timedelta(days=i)
            day_activity = week_activities.filter(date=check_date).first()
            daily_breakdown.append({
                'date': check_date.isoformat(),
                'day_name': check_date.strftime('%A')[:3],
                'minutes': day_activity.time_spent_minutes if day_activity else 0,
                'hours': day_activity.time_spent_hours if day_activity else 0,
                'sessions': day_activity.sessions_count if day_activity else 0,
                'has_activity': bool(day_activity)
            })
        
        response_data = {
            'success': True,
            'data': {
                'weekly_hours': weekly_hours,
                'current_streak': current_streak,
                'today': {
                    'minutes': today_minutes,
                    'hours': today_hours,
                    'sessions': today_sessions
                },
                'weekly_breakdown': daily_breakdown
            }
        }
        
        print("  ✅ View logic executed successfully!")
        print("  Response data structure:")
        print(f"     - Weekly hours: {response_data['data']['weekly_hours']}")
        print(f"     - Current streak: {response_data['data']['current_streak']}")
        print(f"     - Today's minutes: {response_data['data']['today']['minutes']}")
        print(f"     - Daily breakdown entries: {len(response_data['data']['weekly_breakdown'])}")
        
    except Exception as e:
        import traceback
        print(f"  ❌ Error: {str(e)}")
        print(f"  Traceback:")
        traceback.print_exc()
    
    print()
    print("=" * 60)
    print("All tests completed!")
    print("=" * 60)
    
except Exception as e:
    import traceback
    print(f"❌ Fatal error: {str(e)}")
    traceback.print_exc()
    sys.exit(1)
