#!/usr/bin/env python3

import requests
import json

def test_api():
    base_url = "http://127.0.0.1:8000/api"
    
    print("=== TESTING API ENDPOINTS ===")
    
    # Test 1: List all school courses
    try:
        response = requests.get(f"{base_url}/courses/school/")
        print(f"\n1. GET /courses/school/ - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} school courses")
            
            # Show first few courses
            for i, course in enumerate(data[:3]):
                print(f"   Course {i+1}: {course.get('title')} (Class: {course.get('className')}, Subject: {course.get('subject')})")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 2: Search for Hindi courses
    try:
        response = requests.get(f"{base_url}/courses/school/?subject=hindi")
        print(f"\n2. GET /courses/school/?subject=hindi - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} Hindi courses")
            for course in data:
                print(f"   Hindi Course: {course.get('title')} (Class: {course.get('className')}, Board: {course.get('board')})")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 3: Search for 10th class courses
    try:
        response = requests.get(f"{base_url}/courses/school/?class=10th")
        print(f"\n3. GET /courses/school/?class=10th - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} 10th class courses")
            for course in data[:5]:
                print(f"   10th Class: {course.get('title')} (Subject: {course.get('subject')}, Board: {course.get('board')})")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 4: Combined search for Hindi
    try:
        response = requests.get(f"{base_url}/courses/school/?class=10th&board=state&subject=hindi")
        print(f"\n4. GET /courses/school/?class=10th&board=state&subject=hindi - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} matching courses")
            for course in data:
                print(f"   Matching Course: {course.get('title')} (ID: {course.get('id')})")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 5: Search for the specific English course
    try:
        response = requests.get(f"{base_url}/courses/school/?class=12th&board=state&subject=english")
        print(f"\n5. GET /courses/school/?class=12th&board=state&subject=english - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} English courses")
            for course in data:
                print(f"   English Course: {course.get('title')} (ID: {course.get('id')})")
                # Get detailed course info to check resources
                course_id = course.get('id')
                if course_id:
                    try:
                        detail_response = requests.get(f"{base_url}/courses/school/{course_id}/")
                        if detail_response.status_code == 200:
                            detail_data = detail_response.json()
                            print(f"   Course Details: {detail_data.get('title')}")
                            print(f"   Chapters: {len(detail_data.get('chapters', []))}")
                            
                            # Check resources in lessons
                            total_lessons = 0
                            lessons_with_resources = 0
                            
                            for chapter in detail_data.get('chapters', []):
                                for lesson in chapter.get('lessons', []):
                                    total_lessons += 1
                                    resources = lesson.get('resources', {})
                                    downloadable = resources.get('downloadable', [])
                                    internet = resources.get('internet', [])
                                    
                                    if downloadable or internet:
                                        lessons_with_resources += 1
                                        print(f"     Lesson '{lesson.get('title')}' has resources:")
                                        print(f"       Downloadable: {len(downloadable)}")
                                        print(f"       Internet: {len(internet)}")
                                        
                                        # Show first resource details
                                        if downloadable:
                                            first_dl = downloadable[0]
                                            print(f"       First downloadable: {first_dl.get('name')} - {first_dl.get('description')}")
                                        if internet:
                                            first_int = internet[0]
                                            print(f"       First internet: {first_int.get('name')} - {first_int.get('description')}")
                            
                            print(f"   Total lessons: {total_lessons}")
                            print(f"   Lessons with resources: {lessons_with_resources}")
                    except Exception as detail_e:
                        print(f"   Error getting course details: {detail_e}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")

if __name__ == "__main__":
    test_api()
