#!/usr/bin/env python3
"""
Alternative database creation script that handles collation issues
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def create_database_simple():
    """Create database with template0 to avoid collation issues"""
    
    db_params = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD')
    }
    
    database_name = os.getenv('DB_NAME', 'studentshub_db')
    
    print(f"🔄 Creating database '{database_name}' with template0...")
    
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=db_params['host'],
            port=db_params['port'],
            user=db_params['user'],
            password=db_params['password'],
            database='postgres'
        )
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", 
            (database_name,)
        )
        exists = cursor.fetchone()
        
        if exists:
            print(f"✅ Database '{database_name}' already exists!")
        else:
            # Create database with template0 to avoid collation issues
            cursor.execute(f'''
                CREATE DATABASE "{database_name}" 
                WITH TEMPLATE template0 
                ENCODING 'UTF8' 
                LC_COLLATE 'C' 
                LC_CTYPE 'C'
            ''')
            print(f"✅ Database '{database_name}' created successfully!")
        
        cursor.close()
        conn.close()
        
        print(f"🎉 Database ready! Now run: python test_postgres.py")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Manual creation steps:")
        print("1. Open pgAdmin (installed with PostgreSQL)")
        print("2. Connect to PostgreSQL server")
        print("3. Right-click 'Databases' → Create → Database")
        print(f"4. Name: {database_name}")
        print("5. Click Save")
        print("\nOr use SQL:")
        print(f'CREATE DATABASE "{database_name}";')
        return False

if __name__ == "__main__":
    create_database_simple()
