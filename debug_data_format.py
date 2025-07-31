"""
Test script to verify the exact data format being sent from frontend
"""

# This simulates what the frontend is sending
frontend_data = {
    "course_id": "course_1753905281220_sm1rqerkn", 
    "title": "",  # This might be the issue - empty title!
    "topics": {
        "Some Topic": {
            "videos": [],
            "quizQuestions": [],
            "resources": []
        }
    }
}

print("Frontend data being sent:")
print(frontend_data)
print()

# Check what the backend expects
print("Backend expects:")
print("- course_id: string (required)")
print("- title: string (required)")  
print("- topics: object")
print()

# Identify the issue
if not frontend_data.get('title'):
    print("❌ ISSUE FOUND: title is empty string!")
    print("Backend validation will fail because title is required but empty")
    print()
    print("Fix: Ensure courseTitle has a value before sending to backend")
else:
    print("✅ Title is present")

if not frontend_data.get('course_id'):
    print("❌ ISSUE: course_id is missing")
else:
    print("✅ course_id is present")

print()
print("=== SOLUTION ===")
print("The issue is that 'title' is an empty string.")
print("Backend validation: if not course_id or not title:")
print("Empty string is falsy in Python, so validation fails.")
print()
print("Frontend fix needed:")
print("Change: title: courseTitle || 'AI Generated Course'")
print("To ensure title is never empty when courseTitle is empty.")
