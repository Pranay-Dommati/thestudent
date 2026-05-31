import os
from google import genai
from django.conf import settings

def test_models():
    key_path = os.path.join(settings.BASE_DIR, 'easylearnova-5a2456bf394b.json')
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
    
    client = genai.Client(
        vertexai=True,
        project="easylearnova",
        location="us-central1",
    )
    
    models_to_test = [
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    
    for model_name in models_to_test:
        try:
            print(f"Testing {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents="test prompt"
            )
            print(f"SUCCESS with {model_name}: {response.text}")
            return
        except Exception as e:
            print(f"FAILED with {model_name}: {e}")

test_models()
