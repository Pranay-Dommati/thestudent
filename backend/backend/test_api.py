
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from scrib.services.image_generation import generate_handwritten_note
print(generate_handwritten_note('Test'))
