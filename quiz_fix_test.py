#!/usr/bin/env python
"""
Test script to verify the quiz submission fix for school courses
"""

# Simulate the quiz submission scenario
def test_quiz_submission_logic():
    print("Testing Quiz Submission Logic")
    print("=" * 50)
    
    # Simulate school course URL path
    current_path = "/courses/9th/state/ap/hindi/learning/quiz"
    
    # Test URL pattern detection
    is_ai_learning_plan = current_path.startswith('/learning/') and '/quiz' in current_path
    print(f"Current path: {current_path}")
    print(f"Is AI learning plan: {is_ai_learning_plan}")
    
    # Test lesson ID generation for school course
    path_parts = current_path.split('/')
    print(f"Path parts: {path_parts}")
    
    if len(path_parts) >= 6:
        course_type = path_parts[2]  # '9th'
        state_code = path_parts[4]   # 'ap'
        subject = path_parts[5]      # 'hindi'
        
        lesson_id = f"{course_type}_{state_code}_{subject}_quiz"
        print(f"Generated lesson ID: {lesson_id}")
        
        # Test if this is a school course
        is_school_course = isinstance(lesson_id, str) and '_' in lesson_id
        print(f"Is school course: {is_school_course}")
        
        if is_school_course:
            print(f"✅ Would use school quiz endpoint: /api/quiz/submit-school/{lesson_id}/")
        else:
            print(f"❌ Would use regular quiz endpoint: /api/quiz/submit/{lesson_id}/")
    else:
        print("❌ Could not parse URL path")
    
    # Test sample quiz data
    quiz_data = {
        "questions": [
            {"id": 1, "question": "Test question 1", "correctAnswer": 0},
            {"id": 2, "question": "Test question 2", "correctAnswer": 1},
            {"id": 3, "question": "Test question 3", "correctAnswer": 2}
        ]
    }
    
    selected_answers = {"1": 0, "2": 1, "3": 1}  # User got 2 out of 3 correct
    
    print(f"\nQuiz Data: {len(quiz_data['questions'])} questions")
    print(f"Selected Answers: {selected_answers}")
    
    # Calculate score (simulating backend logic)
    correct_answers = 0
    total_questions = len(quiz_data['questions'])
    
    for question in quiz_data['questions']:
        question_id = str(question['id'])
        user_answer = selected_answers.get(question_id)
        correct_answer = question['correctAnswer']
        
        if user_answer is not None and user_answer == correct_answer:
            correct_answers += 1
            print(f"✅ Question {question_id}: Correct")
        else:
            print(f"❌ Question {question_id}: Wrong (selected {user_answer}, correct {correct_answer})")
    
    score = (correct_answers / total_questions) * 100
    passed = score >= 80
    
    print(f"\nResult:")
    print(f"Correct: {correct_answers}/{total_questions}")
    print(f"Score: {score:.1f}%")
    print(f"Passed: {passed}")

if __name__ == "__main__":
    test_quiz_submission_logic()
