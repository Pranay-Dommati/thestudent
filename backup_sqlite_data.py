#!/usr/bin/env python3
"""
Data Migration Script from SQLite to PostgreSQL
"""

import os
import sys
import django
import json
from pathlib import Path

# Set up Django environment for SQLite
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Temporarily change settings to use SQLite
def backup_sqlite_data():
    """Backup data from SQLite database"""
    print("🔄 Switching to SQLite to backup data...")
    
    # Read current settings
    settings_file = Path('backend/settings.py')
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Create temporary SQLite settings
    sqlite_content = content.replace(
        "DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.postgresql',\n        'NAME': os.getenv('DB_NAME', 'studentshub_db'),\n        'USER': os.getenv('DB_USER', 'postgres'),\n        'PASSWORD': os.getenv('DB_PASSWORD', 'your_password'),\n        'HOST': os.getenv('DB_HOST', 'localhost'),\n        'PORT': os.getenv('DB_PORT', '5432'),\n    }\n}",
        "DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.sqlite3',\n        'NAME': BASE_DIR / 'db.sqlite3',\n    }\n}"
    )
    
    # Write temporary SQLite settings
    with open(settings_file, 'w') as f:
        f.write(sqlite_content)
    
    try:
        # Import Django after settings change
        import django
        django.setup()
        
        from django.core.management import call_command
        from django.core import serializers
        from django.apps import apps
        
        print("✅ Connected to SQLite database")
        
        # Get all models
        all_models = apps.get_models()
        data = []
        
        for model in all_models:
            if model._meta.app_label not in ['contenttypes', 'auth']:
                model_data = model.objects.all()
                if model_data.exists():
                    print(f"📦 Backing up {model.__name__}: {model_data.count()} records")
                    for obj in model_data:
                        data.append({
                            'model': f"{model._meta.app_label}.{model._meta.model_name}",
                            'pk': obj.pk,
                            'fields': serializers.serialize('python', [obj])[0]['fields']
                        })
        
        # Save backup
        os.makedirs('sqlite_backup', exist_ok=True)
        with open('sqlite_backup/manual_backup.json', 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"✅ Backup created: {len(data)} records saved")
        return True
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False
    
    finally:
        # Restore PostgreSQL settings
        postgres_content = sqlite_content.replace(
            "DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.sqlite3',\n        'NAME': BASE_DIR / 'db.sqlite3',\n    }\n}",
            "DATABASES = {\n    'default': {\n        'ENGINE': 'django.db.backends.postgresql',\n        'NAME': os.getenv('DB_NAME', 'studentshub_db'),\n        'USER': os.getenv('DB_USER', 'postgres'),\n        'PASSWORD': os.getenv('DB_PASSWORD', 'your_password'),\n        'HOST': os.getenv('DB_HOST', 'localhost'),\n        'PORT': os.getenv('DB_PORT', '5432'),\n    }\n}"
        )
        
        with open(settings_file, 'w') as f:
            f.write(postgres_content)
        
        print("🔄 Settings restored to PostgreSQL")

if __name__ == "__main__":
    os.chdir('backend')
    backup_sqlite_data()
