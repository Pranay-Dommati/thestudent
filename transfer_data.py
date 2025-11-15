#!/usr/bin/env python3
"""
Simple SQLite to PostgreSQL data transfer
"""

import os
import subprocess
import shutil
from pathlib import Path

def switch_to_sqlite():
    """Temporarily switch settings to SQLite"""
    settings_file = Path('backend/settings.py')
    
    # Backup current settings
    shutil.copy(settings_file, 'backend/settings_postgres.py.bak')
    
    # Read current content
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Replace PostgreSQL with SQLite
    new_content = content.replace(
        """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'studentshub_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'your_password'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}""",
        """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}"""
    )
    
    with open(settings_file, 'w') as f:
        f.write(new_content)
    
    print("✅ Switched to SQLite settings")

def restore_postgresql():
    """Restore PostgreSQL settings"""
    settings_file = Path('backend/settings.py')
    backup_file = Path('backend/settings_postgres.py.bak')
    
    if backup_file.exists():
        shutil.copy(backup_file, settings_file)
        backup_file.unlink()
        print("✅ Restored PostgreSQL settings")

def backup_data():
    """Backup data from SQLite"""
    try:
        print("📦 Backing up data from SQLite...")
        
        # Switch to SQLite
        switch_to_sqlite()
        
        # Create backup directory
        os.makedirs('backend/sqlite_backup', exist_ok=True)
        
        # Backup specific apps data
        apps_to_backup = ['authentication', 'courses', 'feedback', 'newsletter']
        
        for app in apps_to_backup:
            print(f"📦 Backing up {app}...")
            result = subprocess.run([
                'python', 'manage.py', 'dumpdata', app,
                '--output', f'sqlite_backup/{app}_data.json',
                '--indent', '2'
            ], cwd='backend', capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ {app} data backed up")
            else:
                print(f"⚠️ {app} backup failed: {result.stderr}")
        
        # Also create a full backup excluding system apps
        print("📦 Creating full backup...")
        result = subprocess.run([
            'python', 'manage.py', 'dumpdata',
            '--exclude', 'contenttypes',
            '--exclude', 'auth.permission',
            '--exclude', 'admin.logentry',
            '--exclude', 'sessions',
            '--output', 'sqlite_backup/full_backup.json',
            '--indent', '2'
        ], cwd='backend', capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Full backup created")
            return True
        else:
            print(f"❌ Full backup failed: {result.stderr}")
            return False
            
    finally:
        restore_postgresql()

def load_data():
    """Load data into PostgreSQL"""
    print("📥 Loading data into PostgreSQL...")
    
    # Try to load the full backup first
    backup_file = 'backend/sqlite_backup/full_backup.json'
    if Path(backup_file).exists():
        result = subprocess.run([
            'python', 'manage.py', 'loaddata', 'sqlite_backup/full_backup.json'
        ], cwd='backend', capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Data loaded successfully!")
            return True
        else:
            print(f"❌ Data loading failed: {result.stderr}")
            
            # Try loading individual apps
            apps = ['authentication', 'courses', 'feedback', 'newsletter']
            for app in apps:
                app_file = f'backend/sqlite_backup/{app}_data.json'
                if Path(app_file).exists():
                    print(f"📥 Loading {app} data...")
                    result = subprocess.run([
                        'python', 'manage.py', 'loaddata', f'sqlite_backup/{app}_data.json'
                    ], cwd='backend', capture_output=True, text=True)
                    
                    if result.returncode == 0:
                        print(f"✅ {app} data loaded")
                    else:
                        print(f"⚠️ {app} data loading failed: {result.stderr}")
            
            return True

def main():
    print("🔄 SQLite to PostgreSQL Data Migration")
    print("=" * 50)
    
    # Step 1: Backup data from SQLite
    if backup_data():
        print("\n🔄 Data backup completed")
    else:
        print("\n❌ Data backup failed")
        return
    
    # Step 2: Load data into PostgreSQL
    load_data()
    
    print("\n🎉 Migration completed!")
    print("🔍 Check your admin panel to verify data: http://localhost:8000/admin")

if __name__ == "__main__":
    main()
