#!/usr/bin/env python3
"""
Test script for ProLearning rate limiting functionality.
Tests both daily limits (16 topics) and per-request limits (4 topics).
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_ENDPOINT = f"{BASE_URL}/api/ai/classify_topics/"

# Test data
TEST_TOPICS = [
    "Introduction to Python Programming",
    "Data Structures and Algorithms", 
    "Machine Learning Fundamentals",
    "Web Development with Django",
    "Database Management Systems",
    "Computer Networks",
    "Operating Systems",
    "Software Engineering",
    "Artificial Intelligence",
    "Cybersecurity Basics",
    "Cloud Computing",
    "Mobile App Development",
    "DevOps and CI/CD",
    "Blockchain Technology",
    "Internet of Things",
    "Game Development",
    "UI/UX Design",
    "Data Science",
    "Statistics and Probability",
    "Linear Algebra"
]

def test_rate_limiting():
    """Test the rate limiting functionality"""
    print("=" * 60)
    print("PROLEARNING RATE LIMITING TEST")
    print("=" * 60)
    print(f"Testing API endpoint: {API_ENDPOINT}")
    print(f"Test started at: {datetime.now()}")
    print()
    
    # Test 1: Single request with 4 topics (should pass)
    print("Test 1: Single request with 4 topics (should PASS)")
    test_single_request(TEST_TOPICS[:4])
    print()
    
    # Test 2: Single request with 5 topics (should fail - exceeds per-request limit)
    print("Test 2: Single request with 5 topics (should FAIL - exceeds per-request limit)")
    test_single_request(TEST_TOPICS[:5])
    print()
    
    # Test 3: Multiple requests to test daily limit
    print("Test 3: Multiple requests to test daily limit")
    test_daily_limit()
    print()
    
    # Test 4: Check current usage
    print("Test 4: Check current usage")
    check_usage()
    print()

def test_single_request(topics):
    """Test a single request with given topics"""
    data = {
        "query": f"Create courses about: {', '.join(topics)}",
        "expected_topics": len(topics)
    }
    
    try:
        response = requests.post(
            API_ENDPOINT,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"  Request: {len(topics)} topics")
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"  Success: {len(result.get('topics', []))} topics classified")
            if 'usage_stats' in result:
                stats = result['usage_stats']
                print(f"  Daily usage: {stats.get('daily_count', 0)}/16")
                print(f"  Request usage: {stats.get('request_count', 0)}/4")
        elif response.status_code == 429:
            result = response.json()
            print(f"  Rate limited: {result.get('error', 'Unknown error')}")
            if 'usage_stats' in result:
                stats = result['usage_stats']
                print(f"  Daily usage: {stats.get('daily_count', 0)}/16")
                print(f"  Request usage: {stats.get('request_count', 0)}/4")
        else:
            print(f"  Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"  Request failed: {e}")

def test_daily_limit():
    """Test the daily limit by making multiple requests"""
    print("  Making multiple requests to test daily limit...")
    
    request_count = 0
    topics_created = 0
    
    # Make requests with 4 topics each until we hit the daily limit
    for i in range(5):  # Try 5 requests (5 * 4 = 20 topics, should hit limit)
        start_idx = i * 4
        batch_topics = TEST_TOPICS[start_idx:start_idx + 4]
        
        if len(batch_topics) < 4:
            batch_topics.extend(TEST_TOPICS[:4 - len(batch_topics)])
        
        request_count += 1
        print(f"    Request {request_count}: {len(batch_topics)} topics")
        
        data = {
            "query": f"Create courses about: {', '.join(batch_topics)}",
            "expected_topics": len(batch_topics)
        }
        
        try:
            response = requests.post(
                API_ENDPOINT,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                topics_in_response = len(result.get('topics', []))
                topics_created += topics_in_response
                print(f"      Success: {topics_in_response} topics")
                
                if 'usage_stats' in result:
                    stats = result['usage_stats']
                    print(f"      Daily usage: {stats.get('daily_count', 0)}/16")
                    
            elif response.status_code == 429:
                result = response.json()
                print(f"      Rate limited: {result.get('error', 'Unknown error')}")
                if 'usage_stats' in result:
                    stats = result['usage_stats']
                    print(f"      Daily usage: {stats.get('daily_count', 0)}/16")
                break
            else:
                print(f"      Error {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"      Request failed: {e}")
        
        # Small delay between requests
        time.sleep(1)
    
    print(f"  Summary: {request_count} requests made, {topics_created} topics created")

def check_usage():
    """Check current usage stats"""
    # Make a minimal request to get usage stats
    data = {
        "query": "Test query for usage check",
        "expected_topics": 0
    }
    
    try:
        response = requests.post(
            API_ENDPOINT,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code in [200, 429]:
            result = response.json()
            if 'usage_stats' in result:
                stats = result['usage_stats']
                print(f"  Current daily usage: {stats.get('daily_count', 0)}/16")
                print(f"  Current request usage: {stats.get('request_count', 0)}/4")
            else:
                print("  No usage stats available")
        else:
            print(f"  Could not check usage: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"  Request failed: {e}")

if __name__ == "__main__":
    print("Make sure both Django backend (8000) and React frontend (5173) are running!")
    print("Press Enter to continue or Ctrl+C to cancel...")
    try:
        input()
        test_rate_limiting()
    except KeyboardInterrupt:
        print("\nTest cancelled by user.")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("You can now test the frontend UI at: http://localhost:5173")
    print("1. Go to the chat page")
    print("2. Click 'Create Course' to enter pro mode")
    print("3. You should see the rate limit status component")
    print("4. Try sending messages to create topics and watch the limits")
    print("=" * 60)
