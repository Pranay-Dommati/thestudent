#!/usr/bin/env python3
"""
Test PostgreSQL connection for Students Hub
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.append(str(backend_path))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.db import connection
from django.core.management.color import color_style

style = color_style()

def test_connection():
    """Test database connection"""
    try:
        print("🔄 Testing PostgreSQL connection...")
        
        # Test connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
        
        print(style.SUCCESS("✅ PostgreSQL connection successful!"))
        print(f"📊 Database version: {version}")
        print(f"🏢 Database name: {connection.settings_dict['NAME']}")
        print(f"👤 Database user: {connection.settings_dict['USER']}")
        print(f"🌐 Database host: {connection.settings_dict['HOST']}")
        print(f"🔌 Database port: {connection.settings_dict['PORT']}")
        
        return True
        
    except Exception as e:
        print(style.ERROR("❌ PostgreSQL connection failed!"))
        print(f"🐛 Error: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check your .env file credentials")
        print("3. Verify database exists")
        print("4. Check if port 5432 is available")
        
        return False

if __name__ == "__main__":
    test_connection()
