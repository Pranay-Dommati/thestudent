#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.chdir('backend')
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def create_admin_user():
    """Create a Django superuser for admin panel access"""
    
    print("🔧 Creating Django Superuser for Admin Panel...")
    
    # Check if superuser already exists
    existing_superusers = User.objects.filter(is_superuser=True)
    if existing_superusers.exists():
        print("\n📋 Existing superusers:")
        for user in existing_superusers:
            print(f"   - Username: {user.username}")
            print(f"     Email: {user.email}")
            print(f"     Active: {user.is_active}")
            print(f"     Staff: {user.is_staff}")
            print(f"     Superuser: {user.is_superuser}")
            print()
    
    # Get user input
    print("Creating new superuser...")
    username = input("Enter username (admin): ").strip() or "admin"
    email = input("Enter email address: ").strip().lower()
    
    if not email:
        print("❌ Email is required!")
        return
    
    # Check if user already exists
    # Our custom User model uses email as the unique identifier; username may be None/ignored
    # Warn if username exists only when model has username
    if hasattr(User, 'username') and username and User.objects.filter(username=username).exists():
        print(f"❌ User with username '{username}' already exists!")
        return
    
    if User.objects.filter(email=email).exists():
        print(f"❌ User with email '{email}' already exists!")
        return
    
    # Get password
    import getpass
    password = getpass.getpass("Enter password: ")
    password_confirm = getpass.getpass("Confirm password: ")
    
    if password != password_confirm:
        print("❌ Passwords don't match!")
        return
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters long!")
        return
    
    try:
        # Create superuser
        # Custom User model requires email and full_name at minimum
        extra = {}
        if hasattr(User, 'username'):
            extra['username'] = username
        user = User.objects.create_superuser(
            email=email,
            full_name=username or email,
            password=password,
            **extra
        )
        
        print(f"\n✅ Superuser '{username}' created successfully!")
        print(f"   Email: {email}")
        if hasattr(User, 'username'):
            print(f"   Username: {username}")
        print("\n🎉 You can now use these credentials to log into the admin panel at:")
        print("   http://localhost:5173/admin-p")
        
        return user
        
    except Exception as e:
        print(f"\n❌ Error creating superuser: {e}")
        return None

if __name__ == "__main__":
    try:
        create_admin_user()
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
