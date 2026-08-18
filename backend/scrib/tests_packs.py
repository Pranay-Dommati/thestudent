"""Tests for content-pack entitlement and quiz grading.

These cover the parts where a bug costs money or leaks paid content:
who counts as owning a pack, what an unpaid user is allowed to fetch, and
whether grading can be influenced by the client.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

# pyrefly: ignore [missing-import]
from .models import (
    ContentPack, PackBundle, PackQuiz, PackQuizQuestion,
    PackPurchase, QuizAttempt, owned_pack_ids, user_owns_pack,
    bundle_offer_for, grant_bundle,
)
# pyrefly: ignore [missing-import]
from .serializers import PackBundleSerializer

User = get_user_model()


def make_pack(slug='os', title='OS', price=9900, **kwargs):
    return ContentPack.objects.create(
        section=ContentPack.SECTION_INTERVIEW,
        category='Operating Systems',
        title=title,
        slug=slug,
        price_paise=price,
        page_count=42,
        free_page_count=10,
        **kwargs,
    )


def make_quiz_with_questions(pack, number=1, n=3):
    quiz = PackQuiz.objects.create(pack=pack, number=number, topic='Scheduling')
    for i in range(n):
        PackQuizQuestion.objects.create(
            quiz=quiz,
            order=i + 1,
            text=f'Question {i + 1}?',
            options=['a', 'b', 'c', 'd'],
            correct_index=i % 4,
        )
    return quiz


class EntitlementTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='a@example.com', full_name='Test User', password='pw12345!')
        self.other = User.objects.create_user(email='b@example.com', full_name='Test User', password='pw12345!')
        self.os_pack = make_pack('os', 'OS')
        self.cn_pack = make_pack('cn', 'CN')

    def test_no_purchase_means_not_owned(self):
        self.assertFalse(user_owns_pack(self.user, self.os_pack))
        self.assertEqual(owned_pack_ids(self.user), set())

    def test_direct_purchase_grants_only_that_pack(self):
        PackPurchase.objects.create(user=self.user, pack=self.os_pack, amount_paise=9900)
        self.assertTrue(user_owns_pack(self.user, self.os_pack))
        self.assertFalse(user_owns_pack(self.user, self.cn_pack))
        self.assertEqual(owned_pack_ids(self.user), {self.os_pack.id})

    def test_bundle_purchase_grants_every_pack_in_it(self):
        bundle = PackBundle.objects.create(name='All 5', slug='all-5', price_paise=39900)
        bundle.packs.set([self.os_pack, self.cn_pack])
        PackPurchase.objects.create(user=self.user, bundle=bundle, amount_paise=39900)

        self.assertTrue(user_owns_pack(self.user, self.os_pack))
        self.assertTrue(user_owns_pack(self.user, self.cn_pack))
        self.assertEqual(owned_pack_ids(self.user), {self.os_pack.id, self.cn_pack.id})

    def test_bundle_covers_packs_added_after_purchase(self):
        """The offer says 'every pack' — a later addition must be included."""
        bundle = PackBundle.objects.create(name='All', slug='all', price_paise=39900)
        bundle.packs.set([self.os_pack])
        PackPurchase.objects.create(user=self.user, bundle=bundle, amount_paise=39900)

        new_pack = make_pack('sd', 'System Design')
        bundle.packs.add(new_pack)

        self.assertTrue(user_owns_pack(self.user, new_pack))

    def test_one_users_purchase_does_not_leak_to_another(self):
        PackPurchase.objects.create(user=self.user, pack=self.os_pack, amount_paise=9900)
        self.assertFalse(user_owns_pack(self.other, self.os_pack))
        self.assertEqual(owned_pack_ids(self.other), set())

    def test_anonymous_owns_nothing(self):
        from django.contrib.auth.models import AnonymousUser
        self.assertFalse(user_owns_pack(AnonymousUser(), self.os_pack))
        self.assertEqual(owned_pack_ids(AnonymousUser()), set())


class QuizAccessTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='q@example.com', full_name='Test User', password='pw12345!')
        self.pack = make_pack('os', 'OS')
        self.quiz = make_quiz_with_questions(self.pack, n=3)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_questions_are_locked_without_purchase(self):
        res = self.client.get(f'/api/scrib/packs/quizzes/{self.quiz.id}/')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.data.get('code'), 'locked')

    def test_submitting_is_locked_without_purchase(self):
        res = self.client.post(
            f'/api/scrib/packs/quizzes/{self.quiz.id}/submit/',
            {'answers': {}}, format='json',
        )
        self.assertEqual(res.status_code, 403)
        self.assertFalse(QuizAttempt.objects.exists())

    def test_owner_gets_questions_without_the_answers(self):
        PackPurchase.objects.create(user=self.user, pack=self.pack, amount_paise=9900)
        res = self.client.get(f'/api/scrib/packs/quizzes/{self.quiz.id}/')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['questions']), 3)
        for question in res.data['questions']:
            self.assertNotIn('correct_index', question)
            self.assertNotIn('explanation', question)


class QuizGradingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='g@example.com', full_name='Test User', password='pw12345!')
        self.pack = make_pack('os', 'OS')
        self.quiz = make_quiz_with_questions(self.pack, n=3)  # correct indexes 0, 1, 2
        PackPurchase.objects.create(user=self.user, pack=self.pack, amount_paise=9900)
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.questions = list(self.quiz.questions.all())

    def _submit(self, answers):
        return self.client.post(
            f'/api/scrib/packs/quizzes/{self.quiz.id}/submit/',
            {'answers': answers}, format='json',
        )

    def test_all_correct_scores_full_marks(self):
        answers = {str(q.id): q.correct_index for q in self.questions}
        res = self._submit(answers)

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['score'], 3)
        self.assertEqual(res.data['total'], 3)

    def test_all_wrong_scores_zero_and_reveals_answers(self):
        answers = {str(q.id): (q.correct_index + 1) % 4 for q in self.questions}
        res = self._submit(answers)

        self.assertEqual(res.data['score'], 0)
        for result in res.data['results']:
            self.assertFalse(result['correct'])
            self.assertIn('correct_index', result)

    def test_missing_and_junk_answers_score_zero_not_error(self):
        res = self._submit({str(self.questions[0].id): 'not-a-number'})

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['score'], 0)

    def test_unanswered_questions_still_count_towards_total(self):
        res = self._submit({str(self.questions[0].id): self.questions[0].correct_index})

        self.assertEqual(res.data['score'], 1)
        self.assertEqual(res.data['total'], 3)

    def test_best_score_is_kept_across_retakes(self):
        self._submit({str(q.id): q.correct_index for q in self.questions})  # 3/3
        res = self._submit({})  # 0/3 on a retake

        self.assertEqual(res.data['score'], 0)
        self.assertEqual(res.data['best_score'], 3, 'a worse retake must not lower the best score')
        self.assertEqual(QuizAttempt.objects.filter(user=self.user, quiz=self.quiz).count(), 2)


class PackCatalogueTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='c@example.com', full_name='Test User', password='pw12345!')
        self.pack = make_pack('os', 'OS')
        make_quiz_with_questions(self.pack, number=1, n=25)
        make_quiz_with_questions(self.pack, number=2, n=25)
        self.client = APIClient()

    def test_catalogue_is_public_and_hides_s3_keys(self):
        res = self.client.get('/api/scrib/packs/catalogue/')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['packs']), 1)
        card = res.data['packs'][0]
        self.assertNotIn('s3_key', card)
        self.assertNotIn('s3_free_key', card)
        self.assertFalse(card['owned'])

    def test_counts_are_reported_per_pack(self):
        res = self.client.get('/api/scrib/packs/catalogue/')
        card = res.data['packs'][0]

        self.assertEqual(card['quiz_count'], 2)
        self.assertEqual(card['question_count'], 50)

    def test_inactive_packs_are_not_listed(self):
        make_pack('hidden', 'Hidden', is_active=False)
        res = self.client.get('/api/scrib/packs/catalogue/')

        slugs = [p['slug'] for p in res.data['packs']]
        self.assertNotIn('hidden', slugs)

    def test_owned_flag_reflects_the_signed_in_user(self):
        PackPurchase.objects.create(user=self.user, pack=self.pack, amount_paise=9900)
        self.client.force_authenticate(self.user)

        res = self.client.get('/api/scrib/packs/catalogue/')
        self.assertTrue(res.data['packs'][0]['owned'])


class PurchaseTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='p@example.com', full_name='Test User', password='pw12345!')
        self.pack = make_pack('os', 'OS', price=9900)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_cannot_order_a_pack_already_owned(self):
        PackPurchase.objects.create(user=self.user, pack=self.pack, amount_paise=9900)
        res = self.client.post('/api/scrib/packs/purchase/', {'pack': 'os'}, format='json')

        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data.get('code'), 'already_owned')

    def test_must_name_exactly_one_of_pack_or_bundle(self):
        both = self.client.post(
            '/api/scrib/packs/purchase/', {'pack': 'os', 'bundle': 'all'}, format='json',
        )
        neither = self.client.post('/api/scrib/packs/purchase/', {}, format='json')

        self.assertEqual(both.status_code, 400)
        self.assertEqual(neither.status_code, 400)

    def test_unknown_pack_is_rejected(self):
        res = self.client.post('/api/scrib/packs/purchase/', {'pack': 'nope'}, format='json')
        self.assertEqual(res.status_code, 404)


class PackDetailTests(TestCase):
    """The prep workspace loads everything from this one endpoint."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='d@example.com', full_name='Test User', password='pw12345!'
        )
        self.os_pack = make_pack('os', 'OS')
        self.cn_pack = make_pack('cn', 'CN')
        self.quiz = make_quiz_with_questions(self.os_pack, number=1, n=5)
        self.client = APIClient()

    def test_detail_lists_every_sibling_for_the_sidebar(self):
        res = self.client.get('/api/scrib/packs/os/')

        self.assertEqual(res.status_code, 200)
        slugs = sorted(p['slug'] for p in res.data['siblings'])
        self.assertEqual(slugs, ['cn', 'os'])

    def test_detail_reports_ownership_and_quizzes(self):
        PackPurchase.objects.create(user=self.user, pack=self.os_pack, amount_paise=9900)
        self.client.force_authenticate(self.user)

        res = self.client.get('/api/scrib/packs/os/')

        self.assertTrue(res.data['owned'])
        self.assertEqual(len(res.data['quizzes']), 1)
        self.assertEqual(res.data['quizzes'][0]['question_count'], 5)

    def test_best_score_shows_on_the_quiz_card(self):
        PackPurchase.objects.create(user=self.user, pack=self.os_pack, amount_paise=9900)
        QuizAttempt.objects.create(user=self.user, quiz=self.quiz, score=4, total=5)
        QuizAttempt.objects.create(user=self.user, quiz=self.quiz, score=2, total=5)
        self.client.force_authenticate(self.user)

        res = self.client.get('/api/scrib/packs/os/')
        card = res.data['quizzes'][0]

        self.assertEqual(card['best_score'], 4)
        self.assertEqual(card['attempts'], 2)

    def test_anonymous_sees_the_pack_but_owns_nothing(self):
        res = self.client.get('/api/scrib/packs/os/')

        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data['owned'])
        self.assertIsNone(res.data['quizzes'][0]['best_score'])

    def test_unknown_slug_is_404(self):
        self.assertEqual(self.client.get('/api/scrib/packs/nope/').status_code, 404)

    def test_pdf_endpoint_404s_when_no_pdf_uploaded(self):
        res = self.client.get('/api/scrib/packs/os/pdf/')

        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.data.get('code'), 'no_pdf')


class AdminAccessTests(TestCase):
    """Pack administration must be staff-only."""

    def setUp(self):
        self.plain = User.objects.create_user(
            email='plain@example.com', full_name='Plain User', password='pw12345!'
        )
        self.staff = User.objects.create_user(
            email='staff@example.com', full_name='Staff User', password='pw12345!'
        )
        self.staff.is_staff = True
        self.staff.save(update_fields=['is_staff'])
        self.pack = make_pack('os', 'OS')
        self.client = APIClient()

    def test_anonymous_cannot_list_packs(self):
        self.assertIn(self.client.get('/api/scrib/admin/packs/').status_code, (401, 403))

    def test_signed_in_non_staff_cannot_list_packs(self):
        self.client.force_authenticate(self.plain)
        self.assertEqual(self.client.get('/api/scrib/admin/packs/').status_code, 403)

    def test_non_staff_cannot_create_a_pack(self):
        self.client.force_authenticate(self.plain)
        res = self.client.post(
            '/api/scrib/admin/packs/', {'title': 'Sneaky', 'category': 'X'}, format='json',
        )

        self.assertEqual(res.status_code, 403)
        self.assertFalse(ContentPack.objects.filter(title='Sneaky').exists())

    def test_staff_can_list_and_create(self):
        self.client.force_authenticate(self.staff)

        listing = self.client.get('/api/scrib/admin/packs/')
        created = self.client.post(
            '/api/scrib/admin/packs/',
            {'title': 'New Pack', 'category': 'Networks', 'price_paise': 9900},
            format='json',
        )

        self.assertEqual(listing.status_code, 200)
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data['slug'], 'new-pack')

    def test_bought_packs_cannot_be_deleted(self):
        PackPurchase.objects.create(user=self.plain, pack=self.pack, amount_paise=9900)
        self.client.force_authenticate(self.staff)

        res = self.client.delete(f'/api/scrib/admin/packs/{self.pack.id}/')

        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data.get('code'), 'has_purchases')
        self.assertTrue(ContentPack.objects.filter(pk=self.pack.pk).exists())


class QuestionImportTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email='s2@example.com', full_name='Staff User', password='pw12345!'
        )
        self.staff.is_staff = True
        self.staff.save(update_fields=['is_staff'])
        self.pack = make_pack('os', 'OS')
        self.quiz = PackQuiz.objects.create(pack=self.pack, number=1)
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    def _import(self, questions):
        return self.client.post(
            f'/api/scrib/admin/quizzes/{self.quiz.id}/questions/',
            {'questions': questions}, format='json',
        )

    def test_bulk_import_creates_all_questions(self):
        res = self._import([
            {'text': 'Q1?', 'options': ['a', 'b'], 'correct_index': 0},
            {'text': 'Q2?', 'options': ['a', 'b', 'c'], 'correct_index': 2},
        ])

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['created'], 2)
        self.assertEqual(self.quiz.questions.count(), 2)

    def test_a_bad_question_rejects_the_whole_import(self):
        res = self._import([
            {'text': 'Fine?', 'options': ['a', 'b'], 'correct_index': 0},
            {'text': 'Broken?', 'options': ['a', 'b'], 'correct_index': 7},
        ])

        self.assertEqual(res.status_code, 400)
        self.assertEqual(
            self.quiz.questions.count(), 0,
            'a partially imported quiz is worse than a rejected one',
        )

    def test_too_few_options_is_rejected(self):
        res = self._import([{'text': 'Q?', 'options': ['only one'], 'correct_index': 0}])
        self.assertEqual(res.status_code, 400)


class QuizCsvImportTests(TestCase):
    """The CSV importer is how quizzes get authored at scale — 5 packs x 10
    quizzes x 25 questions is impractical by hand."""

    def setUp(self):
        self.staff = User.objects.create_user(
            email='csv@example.com', full_name='Staff User', password='pw12345!'
        )
        self.staff.is_staff = True
        self.staff.save(update_fields=['is_staff'])
        self.pack = make_pack('os', 'OS')
        self.client = APIClient()
        self.client.force_authenticate(self.staff)
        self.url = f'/api/scrib/admin/packs/{self.pack.id}/quizzes/import-csv/'

    def _upload(self, text, filename='quizzes.csv'):
        from django.core.files.uploadedfile import SimpleUploadedFile
        f = SimpleUploadedFile(filename, text.encode('utf-8'), content_type='text/csv')
        return self.client.post(self.url, {'file': f}, format='multipart')

    def test_creates_quizzes_and_questions_across_multiple_quiz_numbers(self):
        csv_text = (
            'quiz_number,question,option1,option2,option3,option4,answer,quiz_topic\n'
            '1,What is a deadlock?,A,B,C,D,2,Concurrency\n'
            '1,What is starvation?,A,B,C,D,B,Concurrency\n'
            '2,What is paging?,A,B,C,D,1,Memory\n'
        )
        res = self._upload(csv_text)

        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['quizzes_touched'], 2)
        self.assertEqual(res.data['questions_created'], 3)

        quiz1 = PackQuiz.objects.get(pack=self.pack, number=1)
        quiz2 = PackQuiz.objects.get(pack=self.pack, number=2)
        self.assertEqual(quiz1.questions.count(), 2)
        self.assertEqual(quiz2.questions.count(), 1)
        self.assertEqual(quiz1.topic, 'Concurrency')
        self.assertEqual(quiz2.topic, 'Memory')

    def test_answer_accepts_number_letter_and_exact_text(self):
        csv_text = (
            'quiz_number,question,option1,option2,option3,option4,answer\n'
            '1,By number,Alpha,Beta,Gamma,Delta,3\n'
            '1,By letter,Alpha,Beta,Gamma,Delta,d\n'
            '1,By text,Alpha,Beta,Gamma,Delta,beta\n'
        )
        res = self._upload(csv_text)
        self.assertEqual(res.status_code, 201, res.data)

        quiz = PackQuiz.objects.get(pack=self.pack, number=1)
        by_text = {q.text: q.correct_index for q in quiz.questions.all()}
        self.assertEqual(by_text['By number'], 2)   # option3
        self.assertEqual(by_text['By letter'], 3)   # option4 (D)
        self.assertEqual(by_text['By text'], 1)     # Beta

    def test_existing_quiz_gets_more_questions_appended_not_replaced(self):
        quiz = PackQuiz.objects.create(pack=self.pack, number=1)
        PackQuizQuestion.objects.create(
            quiz=quiz, order=1, text='Already here', options=['a', 'b'], correct_index=0,
        )

        res = self._upload(
            'quiz_number,question,option1,option2,answer\n'
            '1,New one,a,b,A\n'
        )

        self.assertEqual(res.status_code, 201)
        self.assertEqual(quiz.questions.count(), 2)
        self.assertTrue(quiz.questions.filter(text='Already here').exists())
        self.assertTrue(quiz.questions.filter(text='New one').exists())

    def test_one_bad_row_rejects_the_whole_file(self):
        csv_text = (
            'quiz_number,question,option1,option2,answer\n'
            '1,Good question,a,b,A\n'
            '1,Bad answer,a,b,Z\n'
        )
        res = self._upload(csv_text)

        self.assertEqual(res.status_code, 400)
        self.assertEqual(
            PackQuizQuestion.objects.count(), 0,
            'a half-imported quiz is worse than a rejected upload',
        )
        self.assertIn('errors', res.data.get('details', {}))

    def test_missing_required_column_is_rejected(self):
        res = self._upload('quiz_number,question,option1,option2\n1,Q?,a,b\n')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data.get('code'), 'missing_columns')

    def test_blank_trailing_rows_are_skipped(self):
        csv_text = (
            'quiz_number,question,option1,option2,answer\n'
            '1,Real question,a,b,A\n'
            ',,,,\n'
            ',,,,\n'
        )
        res = self._upload(csv_text)

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['questions_created'], 1)

    def test_question_number_column_controls_order(self):
        res = self._upload(
            'quiz_number,question_number,question,option1,option2,answer\n'
            '1,5,Fifth,a,b,A\n'
            '1,1,First,a,b,A\n'
        )
        self.assertEqual(res.status_code, 201)

        quiz = PackQuiz.objects.get(pack=self.pack, number=1)
        ordered = list(quiz.questions.order_by('order').values_list('text', flat=True))
        self.assertEqual(ordered, ['First', 'Fifth'])

    def test_non_staff_cannot_import(self):
        plain = User.objects.create_user(
            email='plain2@example.com', full_name='Plain', password='pw12345!'
        )
        self.client.force_authenticate(plain)
        res = self._upload('quiz_number,question,option1,option2,answer\n1,Q?,a,b,A\n')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(PackQuizQuestion.objects.count(), 0)


class AdminAnalyticsTests(TestCase):
    """Basic product overview — revenue, buyers, engagement. Not per-question
    difficulty, which was explicitly out of scope."""

    def setUp(self):
        self.staff = User.objects.create_user(
            email='analytics@example.com', full_name='Staff User', password='pw12345!'
        )
        self.staff.is_staff = True
        self.staff.save(update_fields=['is_staff'])
        self.buyer1 = User.objects.create_user(
            email='buyer1@example.com', full_name='Buyer One', password='pw12345!'
        )
        self.buyer2 = User.objects.create_user(
            email='buyer2@example.com', full_name='Buyer Two', password='pw12345!'
        )
        self.os_pack = make_pack('os', 'OS', price=9900)
        self.cn_pack = make_pack('cn', 'CN', price=9900)
        self.client = APIClient()
        self.client.force_authenticate(self.staff)
        self.url = '/api/scrib/admin/packs/analytics/'

    def test_non_staff_cannot_view_analytics(self):
        plain = User.objects.create_user(
            email='plain3@example.com', full_name='Plain', password='pw12345!'
        )
        self.client.force_authenticate(plain)
        self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_empty_state_reports_zeros_not_errors(self):
        res = self.client.get(self.url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['overview']['revenue_paise'], 0)
        self.assertEqual(res.data['overview']['buyers'], 0)
        self.assertIsNone(res.data['overview']['avg_score_pct'])
        self.assertEqual(len(res.data['packs']), 2)

    def test_revenue_sums_pack_and_bundle_purchases(self):
        bundle = PackBundle.objects.create(name='All', slug='all', price_paise=15000)
        bundle.packs.set([self.os_pack, self.cn_pack])
        PackPurchase.objects.create(user=self.buyer1, pack=self.os_pack, amount_paise=9900)
        PackPurchase.objects.create(user=self.buyer2, bundle=bundle, amount_paise=15000)

        res = self.client.get(self.url)
        overview = res.data['overview']

        self.assertEqual(overview['revenue_paise'], 9900 + 15000)
        self.assertEqual(overview['pack_purchases'], 1)
        self.assertEqual(overview['bundle_purchases'], 1)

    def test_buyers_are_counted_once_across_pack_and_bundle_purchases(self):
        bundle = PackBundle.objects.create(name='All', slug='all2', price_paise=15000)
        PackPurchase.objects.create(user=self.buyer1, pack=self.os_pack, amount_paise=9900)
        PackPurchase.objects.create(user=self.buyer1, bundle=bundle, amount_paise=15000)
        PackPurchase.objects.create(user=self.buyer2, pack=self.cn_pack, amount_paise=9900)

        res = self.client.get(self.url)

        self.assertEqual(res.data['overview']['buyers'], 2)

    def test_average_score_weighs_each_attempt_equally_not_by_question_count(self):
        big_quiz = make_quiz_with_questions(self.os_pack, number=1, n=25)
        small_quiz = make_quiz_with_questions(self.os_pack, number=2, n=3)
        QuizAttempt.objects.create(user=self.buyer1, quiz=big_quiz, score=25, total=25)   # 100%
        QuizAttempt.objects.create(user=self.buyer1, quiz=small_quiz, score=0, total=3)   # 0%

        res = self.client.get(self.url)

        self.assertEqual(res.data['overview']['avg_score_pct'], 50.0)
        self.assertEqual(res.data['overview']['quiz_attempts'], 2)

    def test_per_pack_breakdown_is_scoped_to_that_pack(self):
        os_quiz = make_quiz_with_questions(self.os_pack, number=1, n=5)
        QuizAttempt.objects.create(user=self.buyer1, quiz=os_quiz, score=5, total=5)
        PackPurchase.objects.create(user=self.buyer1, pack=self.os_pack, amount_paise=9900)

        res = self.client.get(self.url)
        by_id = {row['id']: row for row in res.data['packs']}

        self.assertEqual(by_id[self.os_pack.id]['quiz_attempts'], 1)
        self.assertEqual(by_id[self.os_pack.id]['purchases'], 1)
        self.assertEqual(by_id[self.cn_pack.id]['quiz_attempts'], 0)
        self.assertEqual(by_id[self.cn_pack.id]['purchases'], 0)

    def test_bundle_only_purchase_is_not_attributed_to_any_single_pack(self):
        bundle = PackBundle.objects.create(name='All', slug='all3', price_paise=15000)
        bundle.packs.set([self.os_pack, self.cn_pack])
        PackPurchase.objects.create(user=self.buyer1, bundle=bundle, amount_paise=15000)

        res = self.client.get(self.url)
        by_id = {row['id']: row for row in res.data['packs']}

        self.assertEqual(by_id[self.os_pack.id]['purchases'], 0)
        self.assertEqual(by_id[self.cn_pack.id]['purchases'], 0)
        self.assertEqual(res.data['overview']['bundle_purchases'], 1)


class QuizShuffleOptionsTests(TestCase):
    """The one thing that must never break: the correct answer's *text* stays
    correct no matter where shuffling moves it."""

    def setUp(self):
        self.staff = User.objects.create_user(
            email='shuffle@example.com', full_name='Staff User', password='pw12345!'
        )
        self.staff.is_staff = True
        self.staff.save(update_fields=['is_staff'])
        self.pack = make_pack('os', 'OS')
        self.quiz = PackQuiz.objects.create(pack=self.pack, number=1)
        self.client = APIClient()
        self.client.force_authenticate(self.staff)
        self.url = f'/api/scrib/admin/quizzes/{self.quiz.id}/shuffle-options/'

    def test_correct_answer_text_is_unchanged_after_shuffle(self):
        q = PackQuizQuestion.objects.create(
            quiz=self.quiz, order=1, text='Q?',
            options=['Alpha', 'Beta', 'Gamma', 'Delta'], correct_index=1,  # Beta
        )
        original_correct_text = q.options[q.correct_index]

        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 200)

        q.refresh_from_db()
        self.assertEqual(q.options[q.correct_index], original_correct_text)
        self.assertEqual(set(q.options), {'Alpha', 'Beta', 'Gamma', 'Delta'})

    def test_shuffle_is_correct_across_every_starting_position(self):
        """Run once per possible starting slot (0-3) so a bug that only shows
        up when the answer starts in one particular slot can't hide."""
        questions = []
        for i, correct in enumerate([0, 1, 2, 3]):
            questions.append(PackQuizQuestion.objects.create(
                quiz=self.quiz, order=i + 1, text=f'Q{i}?',
                options=[f'opt{i}-0', f'opt{i}-1', f'opt{i}-2', f'opt{i}-3'],
                correct_index=correct,
            ))
        expected_text = {q.id: q.options[q.correct_index] for q in questions}

        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['shuffled'], 4)

        for q in questions:
            q.refresh_from_db()
            self.assertEqual(
                q.options[q.correct_index], expected_text[q.id],
                f'question starting at correct_index={q.correct_index} broke',
            )

    def test_does_not_touch_other_quizzes(self):
        other_quiz = PackQuiz.objects.create(pack=self.pack, number=2)
        other_q = PackQuizQuestion.objects.create(
            quiz=other_quiz, order=1, text='Other?',
            options=['X', 'Y'], correct_index=0,
        )
        original_options = list(other_q.options)

        self.client.post(self.url)

        other_q.refresh_from_db()
        self.assertEqual(other_q.options, original_options)

    def test_two_option_question_is_handled(self):
        q = PackQuizQuestion.objects.create(
            quiz=self.quiz, order=1, text='T/F?', options=['True', 'False'], correct_index=0,
        )
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 200)
        q.refresh_from_db()
        self.assertEqual(q.options[q.correct_index], 'True')

    def test_empty_quiz_reports_zero_not_an_error(self):
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['shuffled'], 0)

    def test_non_staff_cannot_shuffle(self):
        plain = User.objects.create_user(
            email='plain4@example.com', full_name='Plain', password='pw12345!'
        )
        q = PackQuizQuestion.objects.create(
            quiz=self.quiz, order=1, text='Q?', options=['A', 'B'], correct_index=1,
        )
        original = list(q.options)
        self.client.force_authenticate(plain)

        res = self.client.post(self.url)

        self.assertEqual(res.status_code, 403)
        q.refresh_from_db()
        self.assertEqual(q.options, original)

    def test_unknown_quiz_is_404(self):
        res = self.client.post('/api/scrib/admin/quizzes/999999/shuffle-options/')
        self.assertEqual(res.status_code, 404)


class BundleOfferTests(TestCase):
    """The bundle shown must describe what the buyer still needs.

    Before tiers existed a user who owned one pack was still pitched "unlock all
    3 packs" at the full price — an offer that re-sold them something they had
    already paid for.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email='tier@example.com', full_name='Tier', password='pw12345!'
        )
        self.os = make_pack(slug='os-t', title='OS', price=9900)
        self.oop = make_pack(slug='oop-t', title='OOP', price=9900)
        self.cn = make_pack(slug='cn-t', title='CN', price=9900)

        self.full = PackBundle.objects.create(
            name='All Interview Packs', slug='all-t',
            section=ContentPack.SECTION_INTERVIEW,
            price_paise=19900, covers_count=0,
        )
        self.full.packs.set([self.os, self.oop, self.cn])

        self.two = PackBundle.objects.create(
            name='Any 2 Interview Packs', slug='two-t',
            section=ContentPack.SECTION_INTERVIEW,
            price_paise=14900, covers_count=2,
        )

    def offer(self):
        return bundle_offer_for(self.user, ContentPack.SECTION_INTERVIEW)

    def test_owning_nothing_gets_the_full_offer(self):
        bundle, packs = self.offer()
        self.assertEqual(bundle, self.full)
        self.assertEqual(len(packs), 3)

    def test_owning_one_gets_the_two_pack_tier_over_the_remaining_packs(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)

        bundle, packs = self.offer()

        self.assertEqual(bundle, self.two)
        self.assertEqual(bundle.price_paise, 14900)
        self.assertEqual({p.slug for p in packs}, {'oop-t', 'cn-t'})

    def test_owning_two_offers_nothing_a_single_pack_is_its_own_price(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)
        PackPurchase.objects.create(user=self.user, pack=self.oop)

        bundle, packs = self.offer()

        self.assertIsNone(bundle)
        self.assertEqual(packs, [])

    def test_owning_everything_removes_the_offer(self):
        for pack in (self.os, self.oop, self.cn):
            PackPurchase.objects.create(user=self.user, pack=pack)

        bundle, _ = self.offer()

        self.assertIsNone(bundle)

    def test_full_bundle_purchase_still_grants_every_pack(self):
        bundle, _ = self.offer()
        grant_bundle(self.user, bundle, amount_paise=19900)

        self.assertEqual(
            owned_pack_ids(self.user), {self.os.id, self.oop.id, self.cn.id},
        )

    def test_tier_purchase_grants_exactly_the_missing_packs(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)
        bundle, _ = self.offer()

        grant_bundle(self.user, bundle, amount_paise=14900)

        self.assertEqual(
            owned_pack_ids(self.user), {self.os.id, self.oop.id, self.cn.id},
        )

    def test_tier_revenue_is_recorded_once_not_per_granted_pack(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)
        bundle, _ = self.offer()

        grant_bundle(self.user, bundle, amount_paise=14900)

        total = sum(
            PackPurchase.objects.filter(user=self.user)
            .exclude(pk__in=[])
            .values_list('amount_paise', flat=True)
        )
        self.assertEqual(total, 14900)

    def test_missing_tier_shows_no_offer_rather_than_a_misleading_one(self):
        self.two.delete()
        PackPurchase.objects.create(user=self.user, pack=self.os)

        bundle, _ = self.offer()

        self.assertIsNone(bundle)

    def test_inactive_pack_is_not_counted_as_something_left_to_sell(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)
        self.cn.is_active = False
        self.cn.save()

        # Only OOP remains, so there is nothing to bundle.
        bundle, _ = self.offer()

        self.assertIsNone(bundle)


class BundleOfferPurchaseGuardTests(TestCase):
    """A user must not be able to buy an offer that isn't on the table for them."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='guard@example.com', full_name='Guard', password='pw12345!'
        )
        self.client.force_authenticate(self.user)
        self.os = make_pack(slug='os-g', title='OS', price=9900)
        self.oop = make_pack(slug='oop-g', title='OOP', price=9900)
        self.cn = make_pack(slug='cn-g', title='CN', price=9900)
        self.full = PackBundle.objects.create(
            name='All', slug='all-g', section=ContentPack.SECTION_INTERVIEW,
            price_paise=19900, covers_count=0,
        )
        self.full.packs.set([self.os, self.oop, self.cn])
        PackBundle.objects.create(
            name='Any 2', slug='two-g', section=ContentPack.SECTION_INTERVIEW,
            price_paise=14900, covers_count=2,
        )

    def test_owner_of_two_packs_cannot_order_the_three_pack_bundle(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)
        PackPurchase.objects.create(user=self.user, pack=self.oop)

        res = self.client.post(
            '/api/scrib/packs/purchase/', {'bundle': 'all-g'}, format='json',
        )

        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data.get('code'), 'offer_unavailable')

    def test_owner_of_one_pack_cannot_order_the_full_bundle_at_its_price(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)

        res = self.client.post(
            '/api/scrib/packs/purchase/', {'bundle': 'all-g'}, format='json',
        )

        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data.get('code'), 'offer_unavailable')


class BundleStrikethroughPriceTests(TestCase):
    """The 'instead of ₹X' figure must total only the packs still being sold.

    Charging ₹149 for two ₹99 packs has to read as ₹149 instead of ₹198 — not
    ₹297, which is what summing every pack in the section would give once the
    buyer already owns one.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email='strike@example.com', full_name='Strike', password='pw12345!'
        )
        self.os = make_pack(slug='os-s', title='OS', price=9900)
        self.oop = make_pack(slug='oop-s', title='OOP', price=9900)
        self.cn = make_pack(slug='cn-s', title='CN', price=9900)
        full = PackBundle.objects.create(
            name='All', slug='all-s', section=ContentPack.SECTION_INTERVIEW,
            price_paise=19900, covers_count=0,
        )
        full.packs.set([self.os, self.oop, self.cn])
        PackBundle.objects.create(
            name='Any 2', slug='two-s', section=ContentPack.SECTION_INTERVIEW,
            price_paise=14900, covers_count=2,
        )

    def serialized(self):
        bundle, packs = bundle_offer_for(self.user, ContentPack.SECTION_INTERVIEW)
        return PackBundleSerializer(
            bundle, context={'owned_bundle_ids': set(), 'offer_packs': packs},
        ).data

    def test_full_offer_strikes_the_price_of_all_three(self):
        data = self.serialized()
        self.assertEqual(data['price'], 199)
        self.assertEqual(data['original_price'], 297)

    def test_top_up_strikes_only_the_two_packs_it_sells(self):
        PackPurchase.objects.create(user=self.user, pack=self.os)

        data = self.serialized()

        self.assertEqual(data['price'], 149)
        self.assertEqual(data['original_price'], 198)
        # The frontend only draws the strike-through when there's a real saving.
        self.assertGreater(data['original_price'], data['price'])

    def test_strikethrough_is_suppressed_when_the_tier_is_not_a_saving(self):
        # Mirrors the live test-pricing state: ₹2 packs make a ₹149 tier a worse
        # deal than buying both, and the UI must not claim a discount.
        ContentPack.objects.filter(is_active=True).update(price_paise=200)
        PackPurchase.objects.create(user=self.user, pack=self.os)

        data = self.serialized()

        self.assertEqual(data['original_price'], 4)
        self.assertLess(data['original_price'], data['price'])
