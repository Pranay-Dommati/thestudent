#!/usr/bin/env python3
"""
Simple SQLite to PostgreSQL Data Transfer Script
"""

import os
import subprocess
import sys

def run_command(command, description):
    """Run a command and show output"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, cwd='backend')
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during {description}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False

def main():
    print("🚀 SQLite to PostgreSQL Data Transfer")
    print("=" * 50)
    
    # Step 1: Create backup from SQLite (temporarily switch settings)
    print("\n📦 Step 1: Creating backup from SQLite database...")
    
    # First, let's backup the current PostgreSQL settings
    backup_cmd = 'copy backend\\settings.py backend\\settings_postgres_backup.py'
    os.system(backup_cmd)
    
    # Create a temporary SQLite settings file
    sqlite_settings = '''
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-me-in-production')

DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'authentication',
    'chatbotcourse',
    'corsheaders',
    'courses',
    'feedback',
    'newsletter',
    'rest_framework',
    'social_django',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social_django.middleware.SocialAuthExceptionMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# SQLite Database for backup
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'authentication.User'

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Social Auth
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.getenv('GOOGLE_OAUTH2_CLIENT_ID')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET')
'''
    
    # Write SQLite settings temporarily
    with open('backend/settings.py', 'w') as f:
        f.write(sqlite_settings)
    
    # Create backup from SQLite
    backup_success = run_command(
        'python manage.py dumpdata --exclude=contenttypes --exclude=auth.permission --exclude=admin.logentry --exclude=sessions --output=sqlite_backup.json --indent=2',
        "Creating SQLite data backup"
    )
    
    if not backup_success:
        print("❌ Failed to create SQLite backup")
        return
    
    # Step 2: Restore PostgreSQL settings
    print("\n🔄 Step 2: Restoring PostgreSQL settings...")
    if os.path.exists('backend/settings_postgres_backup.py'):
        restore_cmd = 'copy backend\\settings_postgres_backup.py backend\\settings.py'
        os.system(restore_cmd)
        print("✅ PostgreSQL settings restored")
    
    # Step 3: Load data into PostgreSQL
    print("\n📥 Step 3: Loading data into PostgreSQL...")
    
    # Check if backup file exists and has content
    backup_file = 'backend/sqlite_backup.json'
    if os.path.exists(backup_file):
        # Check file size
        file_size = os.path.getsize(backup_file)
        print(f"📊 Backup file size: {file_size} bytes")
        
        if file_size > 10:  # File has content
            load_success = run_command(
                'python manage.py loaddata sqlite_backup.json',
                "Loading data into PostgreSQL"
            )
            
            if load_success:
                print("🎉 Data migration completed successfully!")
                print("📊 Verifying data...")
                
                # Quick verification
                verify_success = run_command(
                    'python manage.py shell -c "from django.contrib.auth.models import User; print(f\'Users in PostgreSQL: {User.objects.count()}\')"',
                    "Verifying user data"
                )
                
            else:
                print("⚠️ Data loading failed, but database structure is ready")
        else:
            print("⚠️ Backup file is empty - no data to transfer")
    else:
        print("❌ Backup file not found")
    
    # Cleanup
    print("\n🧹 Cleaning up...")
    if os.path.exists('backend/settings_postgres_backup.py'):
        os.remove('backend/settings_postgres_backup.py')
    
    print("\n✅ Migration process completed!")
    print("🔗 Test your application: http://localhost:8000")

if __name__ == "__main__":
    main()
