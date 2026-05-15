import os
import sys
import requests

sys.path.append(os.path.abspath('..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from django.conf import settings
print("OPENAI_IMAGE_MODEL:", settings.OPENAI_IMAGE_MODEL)

# Disable placeholder
settings.SCRIB_PLACEHOLDER_IMAGE_URL = None

from scrib.services.image_generation import generate_handwritten_note
try:
    generate_handwritten_note("Test Topic")
except Exception as e:
    import traceback
    traceback.print_exc()
    
