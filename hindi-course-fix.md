# Fix for Hindi Course Loading Issue

## Problem
The Hindi course is not loading properly at http://localhost:5173/courses/10th/cbse/hindi/learning, while the English course works fine at http://localhost:5173/courses/10th/cbse/english/learning.

## Root Cause
1. The issue is related to case sensitivity in the subject parameter when fetching school courses
2. When loading Hindi course, the subject is being converted to lowercase, which might not match how it's stored in the database
3. The backend filtering is not properly handling case-insensitive matches for non-ASCII languages like Hindi

## Solution

### 1. Frontend Changes
Apply the patch to the CourseLearning.jsx file. This patch adds:

1. Better logging of URL path parts for debugging
2. Preserves the original case of the subject parameter instead of forcing lowercase
3. Adds a fallback mechanism to try alternative capitalization if the first request fails
4. Refactors the API request handling into separate utility functions for better organization

### 2. Backend Changes (Optional, if frontend fix doesn't resolve the issue)
Make the following changes to the `list_school_courses` function in `backend/courses/views.py`:

```python
if subject:
    # Log the subject being searched for debugging
    print(f"Searching for subject: '{subject}'")
    
    # Use iexact for case-insensitive but exact subject matching
    queryset = queryset.filter(subject__iexact=subject)
    
    # If no results with iexact, try icontains as fallback
    if queryset.count() == 0:
        print(f"No exact matches found for subject '{subject}', trying partial match")
        queryset = SchoolCourse.objects.filter(
            class_level=class_level,
            board__iexact=board,
            subject__icontains=subject
        )
```

### 3. Database Verification (Optional)
If issues persist, verify that the Hindi course exists in the database with the expected subject name:

```python
# Run in Django shell
from courses.models import SchoolCourse
hindi_courses = SchoolCourse.objects.filter(subject__icontains='hindi')
print(f"Found {hindi_courses.count()} Hindi courses")
for course in hindi_courses:
    print(f"ID: {course.id}, Subject: {course.subject}, Class: {course.class_level}, Board: {course.board}")
```

## Technical Details

The key improvement is allowing the frontend to try multiple case variations of the subject name rather than enforcing lowercase, which might cause issues with non-ASCII characters or specific capitalization patterns in the database.

Additionally, the backend filtering is made more robust by first trying an exact case-insensitive match (`iexact`) and then falling back to a partial case-insensitive match (`icontains`) if needed.

Finally, better logging and error handling have been added throughout the process to make future debugging easier.
