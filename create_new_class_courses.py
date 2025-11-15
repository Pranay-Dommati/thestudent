#!/usr/bin/env python3

import os
import sys
import django

# Setup Django
os.chdir('backend')
sys.path.insert(0, os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from courses.models import SchoolCourse, CourseChapter, Lesson

def create_sample_courses():
    """Create sample courses for the new classes (6th, 7th, 8th, 9th)"""
    
    print("🚀 Creating sample courses for new classes...")
    
    # Sample courses for each class
    classes_data = [
        {'class_level': '6th', 'subjects': ['Mathematics', 'Science', 'English', 'Hindi']},
        {'class_level': '7th', 'subjects': ['Mathematics', 'Science', 'English', 'Hindi']},
        {'class_level': '8th', 'subjects': ['Mathematics', 'Science', 'English', 'Hindi']},
        {'class_level': '9th', 'subjects': ['Mathematics', 'Science', 'English', 'Hindi']}
    ]
    
    boards = [
        {'board': 'cbse', 'state': ''},
        {'board': 'state', 'state': 'Telangana'},
        {'board': 'state', 'state': 'Andhra Pradesh'}
    ]
    
    created_courses = []
    
    for class_data in classes_data:
        class_level = class_data['class_level']
        subjects = class_data['subjects']
        
        for subject in subjects:
            for board_data in boards:
                board = board_data['board']
                state = board_data['state']
                
                # Create course title
                if board == 'cbse':
                    title = f"{class_level} {subject} - CBSE"
                    description = f"Complete {subject} curriculum for {class_level} CBSE students"
                else:
                    title = f"{class_level} {subject} - {state} State Board"
                    description = f"Complete {subject} curriculum for {class_level} {state} State Board students"
                
                # Check if course already exists
                existing = SchoolCourse.objects.filter(
                    class_level=class_level,
                    board=board,
                    state=state,
                    subject=subject
                ).first()
                
                if existing:
                    print(f"⚠️  Course already exists: {title}")
                    continue
                
                # Create new course
                course = SchoolCourse.objects.create(
                    title=title,
                    short_description=f"Master {subject} for {class_level} with comprehensive lessons and practice",
                    description=description,
                    class_level=class_level,
                    board=board,
                    state=state,
                    subject=subject,
                    duration="40",
                    is_published=True,
                    key_topics=[f"{subject} Fundamentals", f"Advanced {subject}", f"Problem Solving"],
                    learning_points=[f"Master core {subject} concepts", "Develop problem-solving skills", "Build strong foundation"]
                )
                created_courses.append(course)
                print(f"✅ Created: {course.title}")
                
                # Create sample chapters
                chapters_data = [
                    f"Introduction to {subject}",
                    f"Basic {subject} Concepts", 
                    f"Advanced {subject} Topics"
                ]
                
                for i, chapter_name in enumerate(chapters_data, 1):
                    chapter = CourseChapter.objects.create(
                        school_course=course,
                        name=chapter_name,
                        order=i
                    )
                    
                    # Create sample lessons for each chapter
                    lessons_data = [
                        f"Lesson 1: {chapter_name} - Part A",
                        f"Lesson 2: {chapter_name} - Part B"
                    ]
                    
                    for j, lesson_title in enumerate(lessons_data, 1):
                        Lesson.objects.create(
                            chapter=chapter,
                            title=lesson_title,
                            type='video',
                            description=f"Learn about {lesson_title.lower()} with detailed explanations and examples",
                            order=j
                        )
    
    print(f"\n🎉 Successfully created {len(created_courses)} new courses!")
    print("\n📋 Summary by class:")
    for class_level in ['6th', '7th', '8th', '9th']:
        count = len([c for c in created_courses if c.class_level == class_level])
        print(f"   {class_level}: {count} courses")
    
    return created_courses

if __name__ == "__main__":
    try:
        create_sample_courses()
        print("\n✨ Sample course creation completed successfully!")
    except Exception as e:
        print(f"\n❌ Error creating courses: {e}")
        import traceback
        traceback.print_exc()
