#!/usr/bin/env python3

import os
import sys

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from courses.models import SchoolCourse, CourseChapter, Lesson

def create_sample_courses():
    """Create sample courses for the new classes (6th, 7th, 8th, 9th)"""
    
    # Sample courses for each class
    classes_data = [
        {
            'class_level': '6th',
            'subjects': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science']
        },
        {
            'class_level': '7th', 
            'subjects': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science']
        },
        {
            'class_level': '8th',
            'subjects': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science']
        },
        {
            'class_level': '9th',
            'subjects': ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science']
        }
    ]
    
    boards = ['cbse', 'state']
    states = ['Telangana', 'Andhra Pradesh']
    
    created_courses = []
    
    for class_data in classes_data:
        class_level = class_data['class_level']
        subjects = class_data['subjects']
        
        for subject in subjects:
            for board in boards:
                if board == 'cbse':
                    # Create CBSE course
                    course = SchoolCourse.objects.create(
                        title=f"{class_level} {subject} - CBSE",
                        short_description=f"Complete {subject} curriculum for {class_level} CBSE students",
                        description=f"Comprehensive {subject} course covering the entire {class_level} CBSE syllabus with detailed explanations, examples, and practice questions.",
                        class_level=class_level,
                        board=board,
                        subject=subject,
                        duration="50",
                        is_published=True,
                        key_topics=[f"{subject} Basics", f"Advanced {subject}", f"{subject} Problem Solving"],
                        learning_points=[f"Master {subject} concepts", "Solve complex problems", "Build strong foundation"]
                    )
                    created_courses.append(course)
                    print(f"Created: {course.title}")
                    
                    # Create sample chapters
                    for i in range(1, 4):
                        chapter = CourseChapter.objects.create(
                            school_course=course,
                            name=f"Chapter {i}: {subject} Fundamentals {i}",
                            order=i
                        )
                        
                        # Create sample lessons
                        for j in range(1, 3):
                            Lesson.objects.create(
                                chapter=chapter,
                                title=f"Lesson {j}: Introduction to {subject} Part {j}",
                                type='video',
                                description=f"Learn the basics of {subject} in this comprehensive lesson",
                                order=j
                            )
                
                else:  # state board
                    for state in states:
                        # Create State board course
                        course = SchoolCourse.objects.create(
                            title=f"{class_level} {subject} - {state} State Board",
                            short_description=f"Complete {subject} curriculum for {class_level} {state} State Board students",
                            description=f"Comprehensive {subject} course covering the entire {class_level} {state} State Board syllabus with detailed explanations, examples, and practice questions.",
                            class_level=class_level,
                            board=board,
                            state=state,
                            subject=subject,
                            duration="45",
                            is_published=True,
                            key_topics=[f"{subject} Basics", f"Advanced {subject}", f"{subject} Problem Solving"],
                            learning_points=[f"Master {subject} concepts", "Solve complex problems", "Build strong foundation"]
                        )
                        created_courses.append(course)
                        print(f"Created: {course.title}")
                        
                        # Create sample chapters
                        for i in range(1, 3):
                            chapter = CourseChapter.objects.create(
                                school_course=course,
                                name=f"Chapter {i}: {subject} Fundamentals {i}",
                                order=i
                            )
                            
                            # Create sample lessons
                            for j in range(1, 3):
                                Lesson.objects.create(
                                    chapter=chapter,
                                    title=f"Lesson {j}: Introduction to {subject} Part {j}",
                                    type='video',
                                    description=f"Learn the basics of {subject} in this comprehensive lesson",
                                    order=j
                                )
    
    print(f"\nCreated {len(created_courses)} courses successfully!")
    return created_courses

if __name__ == "__main__":
    create_sample_courses()
