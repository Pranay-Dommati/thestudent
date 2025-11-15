import os
import pytest
from django.test import TestCase, TransactionTestCase
from django.db import connection, transaction, IntegrityError
from django.apps import apps
from django.conf import settings
from decimal import Decimal

User = apps.get_model('authentication', 'User')
SchoolCourse = apps.get_model('courses', 'SchoolCourse')
ProLearningCourse = apps.get_model('courses', 'ProLearningCourse')
ProLearningTopic = apps.get_model('courses', 'ProLearningTopic')

# Skip this whole module if DATABASES['default']['ENGINE'] isn't PostgreSQL.
is_postgres_engine = 'postgresql' in settings.DATABASES.get('default', {}).get('ENGINE', '')
pytestmark = pytest.mark.skipif(
    not is_postgres_engine,
    reason=(
        "PostgreSQL engine not configured. Set DB_ENGINE=postgresql or DB_HOST in backend/.env, "
        "then start Postgres and re-run."
    ),
)


class TestPostgresBasics(TestCase):
    def test_database_vendor_is_postgresql(self):
        # Verify that Django is connected to PostgreSQL
        self.assertEqual(connection.vendor, 'postgresql')

    def test_postgres_version(self):
        # Ensure we can fetch the PostgreSQL version
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
        self.assertIn('PostgreSQL', version)


class TestCrudRoundtrip(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            full_name="Test User",
            password="pass1234",
        )

    def test_jsonfield_roundtrip_and_crud(self):
        # Create a SchoolCourse with JSON fields
        course = SchoolCourse.objects.create(
            title="Maths",
            short_description="Algebra basics",
            description="Learn algebra",
            class_level='10th',
            board='cbse',
            subject='Mathematics',
            key_topics=["linear equations", {"polynomials": [1, 2, 3]}],
            learning_points=[{"id": 1, "title": "Intro"}],
            is_published=True,
        )
        self.assertIsNotNone(course.id)

        # Read and verify JSON content persists
        fetched = SchoolCourse.objects.get(id=course.id)
        self.assertEqual(fetched.key_topics[0], "linear equations")
        self.assertEqual(fetched.learning_points[0]["title"], "Intro")

        # Update
        fetched.title = "Advanced Maths"
        fetched.save()
        self.assertEqual(SchoolCourse.objects.get(id=course.id).title, "Advanced Maths")

        # Delete
        fetched.delete()
        self.assertFalse(SchoolCourse.objects.filter(id=course.id).exists())

    def test_transactions_and_rollbacks(self):
        # Verify savepoint/rollback behavior works on Postgres
        initial_count = SchoolCourse.objects.count()
        try:
            with transaction.atomic():
                SchoolCourse.objects.create(
                    title="Physics",
                    short_description="",
                    description="desc",
                    class_level='10th',
                    board='cbse',
                    subject='Physics',
                )
                raise IntegrityError("Force rollback")
        except IntegrityError:
            pass
        self.assertEqual(SchoolCourse.objects.count(), initial_count)


class TestProLearningModels(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="pro@example.com",
            full_name="Pro User",
            password="pass1234",
        )

    def test_prolearning_progress_updates(self):
        course = ProLearningCourse.objects.create(
            user=self.user,
            course_name="AI Foundations",
            description="Intro to AI",
        )
        t1 = ProLearningTopic.objects.create(course=course, topic_name="History", order=1)
        t2 = ProLearningTopic.objects.create(course=course, topic_name="Search", order=2)

        self.assertEqual(course.get_total_topics(), 2)
        self.assertEqual(course.get_completed_topics(), 0)

        # Complete one topic and verify course percentage updates
        t1.mark_completed()
        course.refresh_from_db()
        self.assertEqual(course.get_completed_topics(), 1)
        self.assertGreater(float(course.completion_percentage), 0.0)

        # Complete second topic and verify 100%
        t2.mark_completed()
        course.refresh_from_db()
        self.assertTrue(course.is_completed)
        self.assertEqual(float(course.completion_percentage), 100.0)
