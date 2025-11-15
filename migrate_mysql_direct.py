#!/usr/bin/env python3
"""
Direct MySQL to MySQL migration using mysqldump
This bypasses Django and directly copies data between MySQL databases
"""

import os
import subprocess
from datetime import datetime

# Local MySQL (Docker) configuration
LOCAL_HOST = "localhost"  # or "127.0.0.1"
LOCAL_PORT = "3306"
LOCAL_DB = "easylearnovadb"  # Your local database name
LOCAL_USER = "root"  # Your local MySQL user
LOCAL_PASSWORD = "your_local_password"  # Your local MySQL password

# Remote MySQL (Hostinger) configuration
REMOTE_HOST = "srv1990.hstgr.io"
REMOTE_PORT = "3306"
REMOTE_DB = "u787111463_easylearnovadb"
REMOTE_USER = "u787111463_teamlearnova"
REMOTE_PASSWORD = "EasyLearnova@pranay.23"

def check_mysql_installed():
    """Check if MySQL client tools are installed"""
    try:
        result = subprocess.run(['mysql', '--version'], 
                              capture_output=True, 
                              text=True,
                              check=True)
        print(f"✅ MySQL client found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ MySQL client not found!")
        print("💡 Install MySQL client tools first")
        print("   Windows: Download from https://dev.mysql.com/downloads/installer/")
        print("   Or use Git Bash with MySQL in PATH")
        return False

def export_local_database():
    """Export local MySQL database to SQL file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"local_mysql_backup_{timestamp}.sql"
    
    print(f"\n📤 Exporting LOCAL database...")
    print(f"   Host: {LOCAL_HOST}")
    print(f"   Database: {LOCAL_DB}")
    
    # Build mysqldump command
    cmd = [
        'mysqldump',
        '-h', LOCAL_HOST,
        '-P', LOCAL_PORT,
        '-u', LOCAL_USER,
        f'-p{LOCAL_PASSWORD}',
        '--single-transaction',
        '--routines',
        '--triggers',
        '--events',
        '--no-tablespaces',
        LOCAL_DB
    ]
    
    try:
        with open(backup_file, 'w', encoding='utf-8') as f:
            result = subprocess.run(cmd, 
                                  stdout=f, 
                                  stderr=subprocess.PIPE,
                                  text=True)
        
        if result.returncode == 0:
            file_size = os.path.getsize(backup_file) / 1024 / 1024  # MB
            print(f"   ✅ Export successful: {backup_file} ({file_size:.2f} MB)")
            return backup_file
        else:
            print(f"   ❌ Export failed: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"   ❌ Export error: {e}")
        return None

def import_to_remote(backup_file):
    """Import SQL dump to remote MySQL database"""
    print(f"\n📥 Importing to REMOTE database...")
    print(f"   Host: {REMOTE_HOST}")
    print(f"   Database: {REMOTE_DB}")
    
    response = input("\n   ⚠️  This will OVERWRITE data on remote server. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("   ℹ️  Import cancelled")
        return False
    
    # Build mysql import command
    cmd = [
        'mysql',
        '-h', REMOTE_HOST,
        '-P', REMOTE_PORT,
        '-u', REMOTE_USER,
        f'-p{REMOTE_PASSWORD}',
        REMOTE_DB
    ]
    
    try:
        with open(backup_file, 'r', encoding='utf-8') as f:
            result = subprocess.run(cmd,
                                  stdin=f,
                                  stderr=subprocess.PIPE,
                                  text=True)
        
        if result.returncode == 0:
            print(f"   ✅ Import successful!")
            return True
        else:
            print(f"   ❌ Import failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"   ❌ Import error: {e}")
        return False

def verify_remote_data():
    """Verify data was imported correctly"""
    print(f"\n🔍 Verifying REMOTE database...")
    
    cmd = [
        'mysql',
        '-h', REMOTE_HOST,
        '-P', REMOTE_PORT,
        '-u', REMOTE_USER,
        f'-p{REMOTE_PASSWORD}',
        REMOTE_DB,
        '-e', 'SHOW TABLES;'
    ]
    
    try:
        result = subprocess.run(cmd,
                              capture_output=True,
                              text=True)
        
        if result.returncode == 0:
            tables = result.stdout.strip().split('\n')[1:]  # Skip header
            print(f"   ✅ Found {len(tables)} tables in remote database")
            return True
        else:
            print(f"   ❌ Verification failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"   ❌ Verification error: {e}")
        return False

def main():
    """Main migration workflow"""
    print("🚀 Direct MySQL to MySQL Migration")
    print("=" * 70)
    
    print("\n📋 Migration Plan:")
    print(f"   FROM: {LOCAL_USER}@{LOCAL_HOST}:{LOCAL_PORT}/{LOCAL_DB}")
    print(f"   TO:   {REMOTE_USER}@{REMOTE_HOST}:{REMOTE_PORT}/{REMOTE_DB}")
    
    # Check prerequisites
    if not check_mysql_installed():
        return
    
    # Step 1: Export local database
    backup_file = export_local_database()
    if not backup_file:
        return
    
    # Step 2: Import to remote
    if import_to_remote(backup_file):
        # Step 3: Verify
        verify_remote_data()
        
        print("\n" + "=" * 70)
        print("✅ Migration Complete!")
        print("=" * 70)
        print(f"\n💾 Backup file saved: {backup_file}")
        print("💡 Keep this file safe as a backup")
    else:
        print("\n❌ Migration failed!")
        print(f"💡 Check the backup file: {backup_file}")

if __name__ == "__main__":
    print("\n⚠️  IMPORTANT: Update the database credentials in this script first!")
    print("   Edit lines 11-19 with your LOCAL database details\n")
    
    response = input("Have you updated the LOCAL database credentials? (yes/no): ")
    if response.lower() != 'yes':
        print("\n💡 Please edit migrate_local_to_remote.py and update:")
        print("   LOCAL_HOST, LOCAL_DB, LOCAL_USER, LOCAL_PASSWORD")
        print("\nThen run this script again.")
        exit(0)
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()