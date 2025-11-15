#!/usr/bin/env python
"""
Simple Django server starter script
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

# Now run the server
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
