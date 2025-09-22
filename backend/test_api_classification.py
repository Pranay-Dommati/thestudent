#!/usr/bin/env python3

import sys
import os
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from backend.ai.ai_service import call_intent_classifier

def test_api_classification():
    """Test intent classifier that requires API call (not caught by heuristic)"""
    try:
        print('Testing API-based intent classification...')
        
        # Test with a query that won't be caught by local heuristic
        result = call_intent_classifier("learn python programming")
        
        if result:
            print(f'Success! Result: {result}')
            return True
        else:
            print('No result returned')
            return False
            
    except Exception as e:
        print(f'Error: {str(e)}')
        return False

if __name__ == '__main__':
    success = test_api_classification()
    print(f'Test result: {"PASS" if success else "FAIL"}')