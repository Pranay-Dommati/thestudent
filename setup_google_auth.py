#!/usr/bin/env python
"""
Migration helper for Google Sign-In integration
Run this after updating settings and installing dependencies
"""

import os
import sys
import subprocess

def run_command(command, description):
    """Run a command and print the result"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd="backend")
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"❌ {description} failed")
            if result.stderr:
                print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} failed with exception: {str(e)}")
        return False
    return True

def main():
    print("🚀 Google Sign-In Integration Setup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("backend/manage.py"):
        print("❌ Please run this script from the project root directory (where backend/ folder is)")
        return
    
    print("📋 This script will:")
    print("1. Install Python dependencies")
    print("2. Create social_django migrations")
    print("3. Run migrations")
    print("4. Check integration status")
    
    confirm = input("\n🤔 Continue? (y/N): ").lower().strip()
    if confirm != 'y':
        print("Setup cancelled.")
        return
    
    # Install dependencies
    if not run_command("pip install -r requirements.txt", "Installing dependencies"):
        return
    
    # Create migrations for social_django
    if not run_command("python manage.py makemigrations", "Creating migrations"):
        print("⚠️  This might be expected if no model changes are needed")
    
    # Run migrations
    if not run_command("python manage.py migrate", "Running migrations"):
        return
    
    # Check integration
    print("\n🔍 Checking integration status...")
    
    # Check if Google settings are configured
    env_file = "backend/.env"
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            content = f.read()
            if 'GOOGLE_OAUTH2_CLIENT_ID' in content and 'GOOGLE_OAUTH2_CLIENT_SECRET' in content:
                print("✅ Google OAuth2 environment variables found in .env")
            else:
                print("⚠️  Google OAuth2 credentials not found in .env file")
                print("    Please add GOOGLE_OAUTH2_CLIENT_ID and GOOGLE_OAUTH2_CLIENT_SECRET")
    else:
        print("⚠️  .env file not found. Please create one with Google credentials")
    
    # Test import
    try:
        sys.path.append('backend')
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        import django
        django.setup()
        
        from django.conf import settings
        from authentication.models import User
        
        print("✅ Django settings and User model imported successfully")
        print(f"✅ Auth backends configured: {len(settings.AUTHENTICATION_BACKENDS)} backends")
        print(f"✅ Social auth pipeline configured: {len(settings.SOCIAL_AUTH_PIPELINE)} steps")
        
    except Exception as e:
        print(f"❌ Import test failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 Setup Complete!")
    print("\n📋 Next Steps:")
    print("1. 🔧 Set up Google Cloud Console:")
    print("   - Go to https://console.cloud.google.com/")
    print("   - Create OAuth2 credentials")
    print("   - Add redirect URI: http://localhost:8000/api/auth/google/callback/")
    print("   - Add JavaScript origin: http://localhost:5173")
    print("\n2. 🔑 Update .env file:")
    print("   GOOGLE_OAUTH2_CLIENT_ID=your_client_id")
    print("   GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret")
    print("\n3. 🚀 Start the server:")
    print("   cd backend")
    print("   python manage.py runserver")
    print("\n4. 🧪 Test the endpoints:")
    print("   GET http://localhost:8000/api/auth/google/auth-url/")
    print("   POST http://localhost:8000/api/auth/google/token/")
    print("\n5. 💻 Implement frontend integration")
    print("   See frontend_google_auth.js for examples")

if __name__ == "__main__":
    main()
