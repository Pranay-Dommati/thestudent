import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.abspath('..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from scrib.services.image_generation import generate_handwritten_note
try:
    result = generate_handwritten_note("Test Topic")
    print("SUCCESS:", result)
except Exception as e:
    print("FAILED:", e)
