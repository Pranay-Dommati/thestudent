#!/usr/bin/env python3
"""
Create PostgreSQL database for Students Hub
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def create_database():
    """Create the PostgreSQL database"""
    
    # Database connection parameters
    db_params = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD')
    }
    
    database_name = os.getenv('DB_NAME', 'studentshub_db')
    
    print(f"🔄 Attempting to create database '{database_name}'...")
    print(f"📍 Host: {db_params['host']}")
    print(f"🔌 Port: {db_params['port']}")
    print(f"👤 User: {db_params['user']}")
    
    try:
        # Connect to PostgreSQL server (not to a specific database)
        print("\n🔗 Connecting to PostgreSQL server...")
        conn = psycopg2.connect(
            host=db_params['host'],
            port=db_params['port'],
            user=db_params['user'],
            password=db_params['password'],
            database='postgres'  # Connect to default postgres database
        )
        
        # Set connection to autocommit mode
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database already exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (database_name,))
        exists = cursor.fetchone()
        
        if exists:
            print(f"✅ Database '{database_name}' already exists!")
        else:
            # Create the database
            cursor.execute(f'CREATE DATABASE "{database_name}"')
            print(f"✅ Database '{database_name}' created successfully!")
        
        # Close connections
        cursor.close()
        conn.close()
        
        # Test connection to the new database
        print(f"\n🧪 Testing connection to '{database_name}'...")
        test_conn = psycopg2.connect(
            host=db_params['host'],
            port=db_params['port'],
            user=db_params['user'],
            password=db_params['password'],
            database=database_name
        )
        
        test_cursor = test_conn.cursor()
        test_cursor.execute("SELECT version();")
        version = test_cursor.fetchone()[0]
        
        print(f"✅ Successfully connected to '{database_name}'!")
        print(f"📊 PostgreSQL version: {version}")
        
        test_cursor.close()
        test_conn.close()
        
        print(f"\n🎉 Database setup complete!")
        print(f"📝 You can now run: python migrate_to_postgresql.py")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ PostgreSQL Error: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Verify PostgreSQL is running")
        print("2. Check your password in .env file")
        print("3. Ensure the postgres user has database creation privileges")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    create_database()
