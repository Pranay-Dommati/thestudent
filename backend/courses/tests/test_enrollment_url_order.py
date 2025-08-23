from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

class EnrollmentURLOrderTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('start-predefined-course')  # /api/courses/enroll/

    def test_post_enroll_unauthenticated_returns_401_not_405(self):
        """Ensure POST is routed to correct view (no 405) and requires auth (401)."""
        payload = {"course_type": "school", "course_id": "00000000-0000-0000-0000-000000000000"}
        response = self.client.post(self.url, payload, format='json')
        # We expect 401 because authentication is required, but never 405 now
        self.assertNotEqual(response.status_code, 405, f"Route mis-ordered: got 405. Response data: {getattr(response, 'data', response.content)}")
        self.assertEqual(response.status_code, 401)
