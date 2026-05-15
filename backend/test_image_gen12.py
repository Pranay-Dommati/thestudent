import requests

response = requests.post(
    'https://api.openai.com/v1/images/generations',
    headers={'Authorization': "Bearer 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"},
    json={
        'prompt': 'A testing prompt',
        'model': 'gpt-image-2',
        'n': 1,
        'size': '1024x1024'
    }
)
print(f"Status: {response.status_code}")
data = response.json()
print("Did it return 'data'?", 'data' in data)
if 'data' in data and len(data['data']) > 0:
    print("Keys inside data[0]:", data['data'][0].keys())
