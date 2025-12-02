
import os
import sys
import json
import django
from django.conf import settings
from django.test import RequestFactory
from unittest.mock import MagicMock, patch

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.ai.reading import handle_reading
from backend.ai.summary import handle_summary

def test_reading_streaming():
    print("Testing Reading Streaming...")
    factory = RequestFactory()
    data = {
        'topic': 'Python',
        'stream': True
    }
    request = factory.post(
        '/ai/reading/',
        data=json.dumps(data),
        content_type='application/json'
    )
    
    # Mock call_gemini_api_stream to yield chunks
    with patch('backend.ai.reading.call_gemini_api_stream') as mock_stream:
        mock_stream.return_value = iter(["Chunk 1", "Chunk 2", "Chunk 3"])
        
        response = handle_reading(request)
        
        if response.streaming:
            print("✅ Response is streaming")
            content = b"".join(response.streaming_content)
            print(f"✅ Content received: {len(content)} bytes")
            # Verify NDJSON format
            lines = content.decode('utf-8').strip().split('\n')
            print(f"✅ Received {len(lines)} lines")
            for line in lines:
                try:
                    json.loads(line)
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON: {line}")
        else:
            print("❌ Response is NOT streaming")

def test_summary_streaming():
    print("\nTesting Summary Streaming...")
    factory = RequestFactory()
    data = {
        'topic': 'Python',
        'reading_content': 'Python is a programming language.',
        'stream': True
    }
    request = factory.post(
        '/ai/summary/',
        data=json.dumps(data),
        content_type='application/json'
    )
    
    # Mock call_gemini_api_stream to yield chunks
    with patch('backend.ai.summary.call_gemini_api_stream') as mock_stream:
        mock_stream.return_value = iter(["Summary Chunk 1", "Summary Chunk 2"])
        
        response = handle_summary(request)
        
        if response.streaming:
            print("✅ Response is streaming")
            content = b"".join(response.streaming_content)
            print(f"✅ Content received: {len(content)} bytes")
             # Verify NDJSON format
            lines = content.decode('utf-8').strip().split('\n')
            print(f"✅ Received {len(lines)} lines")
            for line in lines:
                try:
                    json.loads(line)
                except json.JSONDecodeError:
                    print(f"❌ Invalid JSON: {line}")
        else:
            print("❌ Response is NOT streaming")

if __name__ == "__main__":
    test_reading_streaming()
    test_summary_streaming()
