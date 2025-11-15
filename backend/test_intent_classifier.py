#!/usr/bin/env python3

import sys
import os
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from backend.ai.ai_service import call_intent_classifier

def test_enhanced_intent_classifier():
    """Test the enhanced intent classifier with better timeout handling"""
    try:
        print('Testing enhanced intent classifier...')
        
        # Test with a simple query
        result = call_intent_classifier("arrays")
        
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
    success = test_enhanced_intent_classifier()
    print(f'Test result: {"PASS" if success else "FAIL"}')