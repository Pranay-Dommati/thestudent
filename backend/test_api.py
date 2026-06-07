import requests
import json
try:
    res = requests.post('http://127.0.0.1:8000/ai/classify_topics/', json={'query': 'Explain linear equations step by step'})
    print("Status:", res.status_code)
    print("Response:", json.dumps(res.json(), indent=2))
except Exception as e:
    print("Error:", e)
