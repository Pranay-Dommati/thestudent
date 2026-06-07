import requests
import json
try:
    res = requests.post('http://127.0.0.1:8000/ai/quiz/', json={'topic': 'Linear Equations'})
    print("Status:", res.status_code)
    try:
        data = res.json()
        if 'candidates' in data:
            print("Response text length:", len(data['candidates'][0]['content']['parts'][0]['text']))
            print("Preview:\n", data['candidates'][0]['content']['parts'][0]['text'][:300])
        else:
            print("Response:", json.dumps(data, indent=2))
    except json.JSONDecodeError:
        print("Response text:", res.text)
except Exception as e:
    print("Error:", e)
