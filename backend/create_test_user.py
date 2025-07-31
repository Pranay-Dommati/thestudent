#!/usr/bin/env python3

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import User

print("=== Managing Test User ===")

# Check existing users
users = User.objects.all()
print(f"\nFound {users.count()} users in database:")

for user in users[:5]:
    print(f"- ID: {user.id}, Email: {user.email}")

# Create or update test user
test_email = "test@example.com"
test_password = "testpass123"

try:
    # Try to get existing user
    user = User.objects.get(email=test_email)
    print(f"\n✅ Found existing test user: {user.email}")
    
    # Update password
    user.set_password(test_password)
    user.save()
    print(f"🔧 Updated password for {user.email}")
    
except User.DoesNotExist:
    # Create new user
    user = User.objects.create_user(
        email=test_email,
        full_name="Test User",
        password=test_password
    )
    print(f"✅ Created new test user: {user.email}")

print(f"\n🔑 Test credentials:")
print(f"Email: {test_email}")
print(f"Password: {test_password}")

print("\n=== User Management Complete ===")
