"""
Django URL pattern test for Pro Learning endpoints
"""
import os
import sys
import django

# Add the backend directory to Python path
backend_path = r"c:\Users\banny\OneDrive\Documents\Desktop\STUDENTSHUB\SHPRO\thestudent\backend"
sys.path.insert(0, backend_path)

# Change to backend directory
os.chdir(backend_path)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from django.urls import reverse, resolve
from django.test import RequestFactory
from django.contrib.auth.models import User
from courses.pro_learning_views import save_course_from_localStorage

def test_url_patterns():
    print("Testing Pro Learning URL patterns...")
    
    try:
        # Test URL reverse lookup
        url = reverse('pro_learning:save-from-storage')
        print(f"✅ URL reverse lookup successful: {url}")
        
        # Test URL resolution
        resolver = resolve('/api/courses/pro-learning/save-from-storage/')
        print(f"✅ URL resolution successful: {resolver.func.__name__}")
        
        # Test the view function directly
        print(f"✅ View function exists: {save_course_from_localStorage}")
        
    except Exception as e:
        print(f"❌ URL pattern test failed: {e}")
        
        # Try alternative URL patterns
        try:
            resolver = resolve('/api/courses/pro-learning/save-from-storage')
            print(f"✅ Alternative URL (no trailing slash) works: {resolver.func.__name__}")
        except Exception as e2:
            print(f"❌ Alternative URL also failed: {e2}")

if __name__ == "__main__":
    test_url_patterns()
