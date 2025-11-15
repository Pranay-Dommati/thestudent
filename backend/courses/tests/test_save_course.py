import json
from builtins import str, len, list, isinstance, bytes  # satisfy strict linters
from django.test import TestCase
from django.urls import reverse
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
import jwt

User = get_user_model()


def build_jwt_for_user(user):
    payload = {
        'user_id': str(user.id),
        # mimic simplejwt default payload layout minimally
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


class SaveCourseIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Custom User model uses email + full_name, no username field
        self.user = User.objects.create_user(
            email='tester@example.com', full_name='Tester', password='pass1234'
        )
        # Authenticate with a valid SimpleJWT access token (has exp, user_id)
        access = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(access)}')

    def test_save_course_persists_all_content(self):
        url = reverse('pro_learning:save-course')
        payload = {
            'course_name': 'python_basics',
            'title': 'Python Basics',
            'overwrite': True,
            'topics': {
                'Introduction': {
                    'content': {
                        'reading': 'Long reading material about Python...' * 2,
                        'summary': 'Short summary about Python.',
                        'videos': [
                            {'title': 'Intro Video', 'url': 'https://youtu.be/intro'},
                            {'title': 'Setup Video', 'url': 'https://youtu.be/setup'}
                        ],
                        'quiz': [
                            {
                                'question': 'What is Python?',
                                'options': ['Snake', 'Programming Language', 'Car'],
                                'correct': 'Programming Language'
                            }
                        ],
                        'resources': [
                            {'title': 'Docs', 'url': 'https://docs.python.org/3/'},
                            {'title': 'PEP8', 'url': 'https://peps.python.org/pep-0008/'}
                        ]
                    },
                    'readingMaterial': 'Long reading material about Python...' * 2,
                    'summary': 'Short summary about Python.'
                },
                'Data Types': {
                    'content': {
                        'readingMaterial': 'Numbers, strings, lists...' * 2,
                        'topicSummary': 'Data types summary.',
                        'videos': [],
                        'quizQuestions': [],
                        'resources': []
                    }
                }
            }
        }
        res = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 201, res.content)

        # Read back list
        list_url = reverse('pro_learning:course-list-create')
        res_list = self.client.get(list_url)
        self.assertEqual(res_list.status_code, 200)
        self.assertTrue(len(res_list.json()) >= 1)

        # Course id comes from save response
        course = res.json()['course']
        self.assertEqual(course['course_name'], 'python_basics')

        # ORM validations
        from courses.models import ProLearningCourse
        c = ProLearningCourse.objects.get(course_name='python_basics', user=self.user)
        topics = list(c.topics.all().order_by('order'))
        self.assertEqual(len(topics), 2)
        intro = topics[0]
        self.assertIn('Python', intro.reading_material)
        self.assertGreaterEqual(intro.videos.count(), 2)
        self.assertGreaterEqual(intro.resources.count(), 2)
        self.assertGreaterEqual(intro.quiz_questions.count(), 1)

        data_types = topics[1]
        self.assertTrue(data_types.reading_material)
        self.assertTrue(data_types.summary)

    def test_overwrite_updates_in_place(self):
        url = reverse('pro_learning:save-course')
        payload = {
            'course_name': 'overwrite_test',
            'title': 'First Title',
            'overwrite': True,
            'topics': {
                'Only Topic': {
                    'content': {
                        'reading': 'v1',
                        'summary': 's1',
                        'videos': [],
                        'quiz': [],
                        'resources': []
                    }
                }
            }
        }
        r1 = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(r1.status_code, 201)
        course_id_1 = r1.json()['course']['id']

        # Post updated content with overwrite again
        payload['topics']['Only Topic']['content']['reading'] = 'v2 updated'
        r2 = self.client.post(url, data=json.dumps(payload), content_type='application/json')
        self.assertEqual(r2.status_code, 201)
        course_id_2 = r2.json()['course']['id']
        self.assertEqual(course_id_1, course_id_2)  # in-place overwrite

        from courses.models import ProLearningCourse
        c = ProLearningCourse.objects.get(course_name='overwrite_test', user=self.user)
        self.assertEqual(str(c.id), course_id_1)
        self.assertEqual(c.topics.count(), 1)
        self.assertIn('v2 updated', c.topics.first().reading_material)
