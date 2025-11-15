import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from courses.models import EngineeringCourse, CourseSection, Lesson


User = get_user_model()


class UpdateEngineeringCourseQuizTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create admin user
        self.admin = User.objects.create_superuser(
            email='admin@example.com', full_name='Admin', password='adminpass'
        )
        access = AccessToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access)}')

        # Create a minimal engineering course with one section/lesson
        self.course = EngineeringCourse.objects.create(
            title='Eng Course', description='desc', short_description='short',
            is_published=True, proficiency='beginner'
        )
        self.section = CourseSection.objects.create(
            engineering_course=self.course, name='Section 1', order=0
        )
        self.lesson = Lesson.objects.create(
            section=self.section, title='Lesson 1', type='quiz', order=0
        )

    def test_add_quiz_question_via_update(self):
        url = reverse('update-course', kwargs={'course_id': str(self.course.id)})
        sections_payload = [
            {
                'id': self.section.id,
                'name': 'Section 1',
                'lessons': [
                    {
                        'id': self.lesson.id,
                        'title': 'Lesson 1',
                        'type': 'quiz',
                        'quizQuestions': [
                            {
                                'question': 'What is 2+2?',
                                'options': ['3', '4', '5'],
                                'correctAnswer': 1,
                            }
                        ],
                    }
                ],
            }
        ]

        payload = {
            'title': 'Eng Course',
            'category': 'programming',
            'proficiency_level': 'beginner',
            'sections': json.dumps(sections_payload),
        }

        res = self.client.put(url, data=payload, format='multipart')
        self.assertEqual(res.status_code, 200, res.content)

        # Reload lesson and verify quiz
        self.lesson.refresh_from_db()
        self.assertEqual(self.lesson.quiz_questions.count(), 1)
        qq = self.lesson.quiz_questions.first()
        self.assertEqual(qq.question, 'What is 2+2?')
        self.assertEqual(qq.options, ['3', '4', '5'])
        self.assertEqual(qq.correct_answer, '4')  # index 1 mapped to text

        # Now send an update without quizQuestions key; existing quiz must remain (guard)
        sections_payload_no_quiz = [
            {
                'id': self.section.id,
                'name': 'Section 1',
                'lessons': [
                    {
                        'id': self.lesson.id,
                        'title': 'Lesson 1',
                        'type': 'quiz',
                        # intentionally omit quizQuestions
                    }
                ],
            }
        ]
        payload2 = {
            'title': 'Eng Course',
            'sections': json.dumps(sections_payload_no_quiz),
        }
        res2 = self.client.put(url, data=payload2, format='multipart')
        self.assertEqual(res2.status_code, 200, res2.content)
        self.lesson.refresh_from_db()
        self.assertEqual(self.lesson.quiz_questions.count(), 1)
