import os
from google import genai

# Load credentials
key_path = os.path.join(os.path.dirname(__file__), 'easylearnova-5a2456bf394b.json')
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path

try:
    print("Initializing client...")
    client = genai.Client(
        vertexai=True,
        project="easylearnova",
        location="us-central1"
    )
    
    print("Listing models...")
    for model in client.models.list():
        print(f"- {model.name}")
        
except Exception as e:
    print(f"Error: {e}")
