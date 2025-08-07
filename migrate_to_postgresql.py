#!/usr/bin/env python3
"""
PostgreSQL Migration Script for Students Hub
This script helps migrate from SQLite3 to PostgreSQL
"""

import os
import sys
import subprocess
import json

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during {description}")
        print(f"Error: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        return False

def backup_sqlite_data():
    """Backup existing SQLite data"""
    print("\n📦 Backing up SQLite data...")
    
    # Create backup directory
    backup_dir = "sqlite_backup"
    os.makedirs(backup_dir, exist_ok=True)
    
    # Dump data from SQLite
    backup_commands = [
        f"python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > {backup_dir}/data_backup.json",
        f"cp db.sqlite3 {backup_dir}/db_backup.sqlite3" if os.name != 'nt' else f"copy db.sqlite3 {backup_dir}\\db_backup.sqlite3"
    ]
    
    for cmd in backup_commands:
        if not run_command(cmd, f"Running: {cmd}"):
            return False
    
    print(f"✅ Data backed up to {backup_dir}/")
    return True

def setup_postgresql():
    """Instructions for PostgreSQL setup"""
    print("\n🐘 PostgreSQL Setup Instructions:")
    print("=" * 50)
    print("1. Install PostgreSQL on your system:")
    print("   - Windows: Download from https://www.postgresql.org/download/windows/")
    print("   - macOS: brew install postgresql")
    print("   - Linux: sudo apt-get install postgresql postgresql-contrib")
    print()
    print("2. Start PostgreSQL service:")
    print("   - Windows: Services → PostgreSQL")
    print("   - macOS/Linux: sudo systemctl start postgresql")
    print()
    print("3. Create database and user:")
    print("   sudo -u postgres psql")
    print("   CREATE DATABASE studentshub_db;")
    print("   CREATE USER postgres WITH ENCRYPTED PASSWORD 'your_password';")
    print("   GRANT ALL PRIVILEGES ON DATABASE studentshub_db TO postgres;")
    print("   \\q")
    print()
    print("4. Update your .env file with the correct DB_PASSWORD")
    print()

def migrate_to_postgresql():
    """Migrate to PostgreSQL"""
    print("\n🔄 Migrating to PostgreSQL...")
    
    migration_commands = [
        "python manage.py makemigrations",
        "python manage.py migrate",
    ]
    
    for cmd in migration_commands:
        if not run_command(cmd, f"Running: {cmd}"):
            return False
    
    return True

def load_backup_data():
    """Load the backed up data into PostgreSQL"""
    print("\n📥 Loading backup data into PostgreSQL...")
    
    backup_file = "sqlite_backup/data_backup.json"
    if os.path.exists(backup_file):
        return run_command(f"python manage.py loaddata {backup_file}", "Loading backup data")
    else:
        print("⚠️ No backup file found. You'll need to recreate your data.")
        return True

def create_superuser():
    """Prompt to create a new superuser"""
    print("\n👤 Creating superuser account...")
    print("You'll need to create a new superuser account for PostgreSQL")
    
    try:
        subprocess.run("python manage.py createsuperuser", shell=True, check=True)
        return True
    except subprocess.CalledProcessError:
        print("⚠️ Superuser creation skipped or failed")
        return True

def main():
    """Main migration process"""
    print("🚀 Students Hub PostgreSQL Migration Tool")
    print("=" * 50)
    
    # Change to backend directory
    os.chdir("backend")
    
    # Step 1: Backup existing data
    if not backup_sqlite_data():
        print("❌ Backup failed. Stopping migration.")
        return
    
    # Step 2: PostgreSQL setup instructions
    setup_postgresql()
    
    # Ask user if PostgreSQL is ready
    response = input("\n❓ Have you completed PostgreSQL setup? (y/n): ").lower()
    if response != 'y':
        print("Please complete PostgreSQL setup first, then run this script again.")
        return
    
    # Step 3: Migrate database schema
    if not migrate_to_postgresql():
        print("❌ Migration failed. Check your PostgreSQL connection.")
        return
    
    # Step 4: Load backup data
    if not load_backup_data():
        print("⚠️ Data loading failed, but database schema is ready.")
    
    # Step 5: Create superuser
    create_superuser()
    
    print("\n🎉 Migration completed successfully!")
    print("Your Django app is now using PostgreSQL!")
    print("\n📝 Next steps:")
    print("1. Test your application: python manage.py runserver")
    print("2. Verify all data is present")
    print("3. Update your production settings if needed")

if __name__ == "__main__":
    main()
