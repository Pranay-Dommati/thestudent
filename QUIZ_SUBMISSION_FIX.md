## Quiz Submission Fix - Implementation Summary

### Problem
School course quizzes at URLs like `/courses/9th/state/ap/hindi/learning/quiz` were failing with 404 errors because:
- The quiz submission endpoint expected integer lesson IDs from database Lesson objects
- School courses generate quiz content dynamically and don't have Lesson objects
- Generated lesson IDs like `9th_ap_hindi_quiz` were being sent to `/api/quiz/submit/undefined/301/`

### Solution Implemented

#### 1. Backend Changes

**New URL Route** (`backend/courses/urls.py`):
```python
path('api/quiz/submit-school/<str:quiz_id>/', views.submit_school_quiz, name='submit-school-quiz'),
```

**New View Function** (`backend/courses/views.py`):
- `submit_school_quiz(request, quiz_id)` - Handles quiz submissions for school courses
- Accepts string-based quiz IDs like `9th_ap_hindi_quiz`
- Calculates scores from quiz questions passed in request data
- Returns same response format as regular quiz submissions

#### 2. Frontend Changes

**Updated Quiz Submission Logic** (`StandaloneQuizPage.jsx`):
- Enhanced URL pattern detection: `currentPath.startsWith('/learning/')` instead of `includes('/learning/')`
- Added school course detection: `typeof lessonId === 'string' && lessonId.includes('_')`
- Routes school courses to new endpoint: `/api/quiz/submit-school/${lessonId}/`
- Passes quiz questions data for backend score calculation

#### 3. Flow Diagram

```
User submits quiz at /courses/9th/state/ap/hindi/learning/quiz
  ↓
Frontend generates lesson ID: "9th_ap_hindi_quiz"
  ↓
Detects school course (string with underscores)
  ↓
Sends to: POST /api/quiz/submit-school/9th_ap_hindi_quiz/
  ↓
Backend calculates score from provided quiz questions
  ↓
Returns result: { score, passed, correct_answers, total_questions }
```

#### 4. Test Results

**URL Pattern Detection**: ✅ Correctly identifies school vs AI learning plan courses
**Lesson ID Generation**: ✅ Creates proper IDs like `9th_ap_hindi_quiz`
**Endpoint Routing**: ✅ Routes to correct submission endpoint
**Score Calculation**: ✅ Accurately calculates scores from quiz questions

### Testing the Fix

To test the implementation:

1. Navigate to a school course quiz: `/courses/9th/state/ap/hindi/learning/quiz`
2. Answer quiz questions
3. Submit the quiz
4. Verify the request goes to `/api/quiz/submit-school/9th_ap_hindi_quiz/`
5. Check that scores are calculated correctly

### Files Modified

1. `backend/courses/urls.py` - Added new quiz submission route
2. `backend/courses/views.py` - Added `submit_school_quiz` function
3. `frontend/src/components/CourseLearningPage/templ/StandaloneQuizPage.jsx` - Updated submission logic

The fix ensures school course quizzes work properly while maintaining compatibility with existing AI learning plan and regular course quizzes.
