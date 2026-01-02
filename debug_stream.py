
import requests
import json
import sys

# URL
URL = "http://127.0.0.1:8000/api/visualizer/trace-stream/"

# Payload matches the user's case
code = """class Solution:
    def longestPalindrome(self, s: str) -> str:
        def expand(l, r):
            while l >= 0 and r < len(s) and s[l] == s[r]:
                l -= 1
                r += 1
            return s[l+1:r]
            
        longest = ""
        for i in range(len(s)):
            odd_len = expand(i, i)
            # even_len = expand(i, i+1)

            if len(odd_len) > len(longest):
                longest = odd_len
            # if len(even_len) > len(longest):
            #     longest = even_len
            
        return longest
"""

payload = {
    "code": code,
    "inputs": ["aba"],
    "codeType": "class",
    "functionName": "longestPalindrome",
    "className": "Solution",
    "inputTypes": ["str"]
}

print(f"Connecting to {URL}...")
try:
    with requests.post(URL, json=payload, stream=True) as response:
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Error:", response.text)
            sys.exit(1)
            
        print("--- Stream Start ---")
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                print(f"[RAW] {decoded_line}")
                if decoded_line.startswith("data: "):
                    try:
                        data = json.loads(decoded_line[6:])
                        if data.get('type') == 'frame':
                            print(f"✅ Received Frame {data.get('index')}: Step {data.get('frame', {}).get('step')}")
                    except:
                        print("❌ JSON Parse Failed")
        print("--- Stream End ---")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
