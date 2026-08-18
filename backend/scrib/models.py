from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.text import slugify
import uuid


class PreviewNote(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    tags = models.JSONField(default=list, blank=True)
    image_url = models.URLField(blank=True, default='')  # legacy thumbnail / preview image
    pdf_url = models.URLField(blank=True, null=True)      # PDF stored in S3 — primary download URL
    page_count = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def resolved_pdf_url(self):
        """Return pdf_url if set. Empty string = not available yet."""
        return self.pdf_url or ''

    class Meta:
        ordering = ['title']
        indexes = [
            models.Index(fields=['slug'], name='scrib_prev_slug_idx'),
            models.Index(fields=['is_active'], name='scrib_prev_active_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:240] or 'preview'
            slug = base_slug
            counter = 1
            while PreviewNote.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class GeneratedNote(models.Model):
    SOURCE_GENERATED = 'generated'
    SOURCE_CACHE = 'cache'
    SOURCE_PREVIEW = 'preview'

    SOURCE_CHOICES = [
        (SOURCE_GENERATED, 'Generated'),
        (SOURCE_CACHE, 'Cache'),
        (SOURCE_PREVIEW, 'Preview'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scrib_notes',
    )
    prompt = models.TextField()
    normalized_prompt = models.CharField(max_length=255, db_index=True)
    image_url = models.URLField()
    page_count = models.PositiveIntegerField(default=1)
    credits_used = models.PositiveIntegerField(default=1)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=SOURCE_GENERATED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='scrib_note_user_idx'),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.prompt[:32]}"


class StudyPack(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_GENERATING = 'generating'
    STATUS_READY = 'ready'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_GENERATING, 'Generating'),
        (STATUS_READY, 'Ready'),
        (STATUS_FAILED, 'Failed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scrib_study_packs',
    )
    title = models.CharField(max_length=255)
    topics_json = models.JSONField(default=list, blank=True)
    pdf_url = models.TextField(blank=True, null=True)         # legacy / presigned URL (may expire — use s3_key for access)
    s3_key = models.CharField(max_length=1024, blank=True, null=True)  # permanent S3 object key
    s3_preview_key = models.CharField(max_length=1024, blank=True, null=True)  # extracted 1-page preview S3 key
    share_token = models.UUIDField(default=None, null=True, blank=True, unique=True, db_index=True)  # permanent public share token
    total_pages = models.PositiveIntegerField(default=0)
    credits_used = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    pages_done = models.PositiveIntegerField(default=0)  # incremented after each image completes
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Set the moment a Celery worker actually picks up the task (as opposed to
    # created_at, which is set when the row is submitted — status is already
    # GENERATING at that point even while still queued behind busy workers).
    # Lets cleanup_stuck_packs tell "legitimately queued" apart from "started
    # then died" so it never fails a job that's merely waiting for a free worker.
    started_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='scrib_pack_user_idx'),
            models.Index(fields=['status'], name='scrib_pack_status_idx'),
        ]

    def __str__(self):
        return f"{self.title} ({self.user_id})"


class Payment(models.Model):
    STATUS_CREATED = 'created'
    STATUS_PAID = 'paid'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_CREATED, 'Created'),
        (STATUS_PAID, 'Paid'),
        (STATUS_FAILED, 'Failed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scrib_payments',
    )
    razorpay_order_id = models.CharField(max_length=120, unique=True)
    razorpay_payment_id = models.CharField(max_length=120, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    amount = models.PositiveIntegerField(help_text='Amount in paise')
    currency = models.CharField(max_length=10, default='INR')
    credits_added = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_CREATED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='scrib_pay_user_idx'),
            models.Index(fields=['status'], name='scrib_pay_status_idx'),
        ]

    def __str__(self):
        return f"{self.razorpay_order_id} ({self.status})"


class CreditTransaction(models.Model):
    DIRECTION_CREDIT = 'credit'
    DIRECTION_DEBIT = 'debit'

    DIRECTION_CHOICES = [
        (DIRECTION_CREDIT, 'Credit'),
        (DIRECTION_DEBIT, 'Debit'),
    ]

    REASON_PAYMENT = 'payment'
    REASON_GENERATION = 'generation'
    REASON_ADJUSTMENT = 'adjustment'
    REASON_REFUND = 'refund'
    REASON_PROMO = 'promo'
    REASON_SIGNUP_BONUS = 'signup_bonus'
    REASON_REFERRAL = 'referral'

    REASON_CHOICES = [
        (REASON_PAYMENT, 'Payment'),
        (REASON_GENERATION, 'Generation'),
        (REASON_ADJUSTMENT, 'Adjustment'),
        (REASON_REFUND, 'Refund'),
        (REASON_PROMO, 'Promo Code'),
        (REASON_SIGNUP_BONUS, 'Signup Bonus'),
        (REASON_REFERRAL, 'Referral Reward'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scrib_credit_transactions',
    )
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    credits = models.FloatField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_transactions',
    )
    generated_note = models.ForeignKey(
        GeneratedNote,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_transactions',
    )
    study_pack = models.ForeignKey(
        StudyPack,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_transactions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='scrib_credit_user_idx'),
        ]

    def __str__(self):
        return f"{self.user_id} {self.direction} {self.credits}"


class PromoCode(models.Model):
    """A redeemable promo/coupon code for granting Scrib credits.

    Use select_for_update() when incrementing times_redeemed to prevent
    race conditions when two requests try to redeem the last slot simultaneously.
    """

    code = models.CharField(max_length=32, unique=True, db_index=True)
    credits_to_add = models.FloatField(default=5.0)
    campaign_name = models.CharField(max_length=100)
    max_redemptions = models.PositiveIntegerField(default=1)
    times_redeemed = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_promo_codes',
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code'], name='scrib_promo_code_idx'),
            models.Index(fields=['campaign_name'], name='scrib_promo_campaign_idx'),
            models.Index(fields=['is_active', 'expires_at'], name='scrib_promo_active_idx'),
        ]

    @property
    def remaining_redemptions(self):
        return max(self.max_redemptions - self.times_redeemed, 0)

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    @property
    def status(self):
        if not self.is_active:
            return 'inactive'
        if self.is_expired:
            return 'expired'
        if self.remaining_redemptions == 0:
            return 'exhausted'
        return 'active'

    def __str__(self):
        return f"{self.code} ({self.campaign_name})"


class PromoCodeRedemption(models.Model):
    """Tracks which user redeemed which promo code and when."""

    promo_code = models.ForeignKey(
        PromoCode,
        on_delete=models.CASCADE,
        related_name='redemptions',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='promo_redemptions',
    )
    credits_added = models.FloatField()
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-redeemed_at']
        # Prevent a user from redeeming the same code twice at the DB level
        unique_together = [('promo_code', 'user')]
        indexes = [
            models.Index(fields=['promo_code', 'user'], name='scrib_rdem_code_user_idx'),
            models.Index(fields=['user', 'redeemed_at'], name='scrib_rdem_user_idx'),
        ]

    def __str__(self):
        return f"{self.user_id} redeemed {self.promo_code.code}"


class ScribConfig(models.Model):
    """Singleton (pk=1) that controls the active marketing cohort.

    Cohort A — 'preview':     Show the PreviewPromoModal (browse samples).
    Cohort B — 'free_credit': Show the FreeCreditsModal (get 1 free credit).

    When cohort == 'free_credit' AND give_free_credit_on_signup is True,
    the OTP-verify signup flow actually grants 1 free credit to the new user.
    """

    COHORT_PREVIEW = 'preview'
    COHORT_FREE_CREDIT = 'free_credit'

    COHORT_CHOICES = [
        (COHORT_PREVIEW, 'Preview Modal (Cohort A)'),
        (COHORT_FREE_CREDIT, 'Free Credit Modal (Cohort B)'),
    ]

    cohort = models.CharField(
        max_length=20,
        choices=COHORT_CHOICES,
        default=COHORT_PREVIEW,
    )
    give_free_credit_on_signup = models.BooleanField(
        default=False,
        help_text='When True and cohort is free_credit, grant 1 free credit on OTP signup verification.',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Scrib Config'
        verbose_name_plural = 'Scrib Config'

    @classmethod
    def get(cls):
        """Return the singleton config, creating it with defaults if it doesn't exist yet."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        credit_label = ' (+ free credit)' if self.give_free_credit_on_signup else ''
        return f'ScribConfig: {self.cohort}{credit_label}'


class CohortPeriod(models.Model):
    """Immutable log of every cohort Scrib has run.

    When the admin switches cohorts:
      1. The current active period gets ended_at = now.
      2. A new period is created with started_at = now, ended_at = NULL.

    Once a period is closed (ended_at is set) it is NEVER modified.
    Analytics are derived from User.signup_cohort, not from these timestamps —
    CohortPeriod is used only to (a) determine the active cohort at signup time,
    and (b) display a historical timeline in the admin.
    """

    COHORT_PREVIEW     = 'preview'
    COHORT_FREE_CREDIT = 'free_credit'

    COHORT_CHOICES = [
        (COHORT_PREVIEW,     'Cohort A — Preview Modal'),
        (COHORT_FREE_CREDIT, 'Cohort B — Free Credit'),
    ]

    cohort      = models.CharField(max_length=20, choices=COHORT_CHOICES)
    started_at  = models.DateTimeField()
    ended_at    = models.DateTimeField(null=True, blank=True)
    switched_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cohort_switches',
    )

    class Meta:
        ordering = ['started_at']
        verbose_name = 'Cohort Period'
        verbose_name_plural = 'Cohort Periods'
        indexes = [
            models.Index(fields=['cohort'], name='scrib_cohort_period_cohort_idx'),
            models.Index(fields=['ended_at'], name='scrib_cohort_period_ended_idx'),
        ]

    @classmethod
    def current(cls):
        """Return the currently active period (ended_at IS NULL), or None."""
        return cls.objects.filter(ended_at__isnull=True).order_by('-started_at').first()

    @classmethod
    def cohort_at(cls, dt):
        """Return the cohort name active at a given datetime, or None."""
        period = cls.objects.filter(
            started_at__lte=dt
        ).filter(
            models.Q(ended_at__isnull=True) | models.Q(ended_at__gt=dt)
        ).order_by('-started_at').first()
        return period.cohort if period else None

    def __str__(self):
        end = self.ended_at.strftime('%Y-%m-%d') if self.ended_at else 'now'
        return f'{self.cohort}: {self.started_at.strftime("%Y-%m-%d")} → {end}'


# ─── Earn While Learning ───────────────────────────────────────────────────────────────────────────────────────

class NoteShareLink(models.Model):
    """ One row per (owner, study_pack) pair.

    Each user who owns a pack (either by generating it or purchasing via a share
    link) gets their own unique share_code. Two owners of the same pack will
    have different share codes so credits flow to the correct sharer.

    share_code is an 8-character Base36 string (A-Z + 0-9), generated by
    scrib.share_constants.generate_share_code().
    """

    study_pack = models.ForeignKey(
        StudyPack,
        on_delete=models.CASCADE,
        related_name='share_links',
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='share_links',
    )
    share_code = models.CharField(
        max_length=8,
        unique=True,
        db_index=True,
        help_text='8-char Base36 code used in the public share URL (e.g. SCR8F2KD)',
    )
    is_active = models.BooleanField(default=True)
    purchase_count = models.PositiveIntegerField(default=0)
    # Cumulative rewards earned through this specific link.
    reward_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reward_type = models.CharField(
        max_length=20,
        default='credits',
        help_text='credits in V1; change to cash in V2 without a migration',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        # One link per (owner, pack) pair — idempotent creation safe.
        unique_together = [('study_pack', 'owner')]
        indexes = [
            models.Index(fields=['share_code'], name='scrib_sharelink_code_idx'),
            models.Index(fields=['owner', 'created_at'], name='scrib_sharelink_owner_idx'),
        ]

    def __str__(self):
        return f'{self.share_code} → {self.study_pack_id} (owner={self.owner_id})'


class SharedPackPurchase(models.Model):
    """Records every completed purchase made through a NoteShareLink.

    Analytics fields (clicked_at, conversion_time, device, browser, country)
    are captured at the time of the purchase and are available in Django admin.
    They are never exposed through public API endpoints.
    """

    share_link = models.ForeignKey(
        NoteShareLink,
        on_delete=models.CASCADE,
        related_name='purchases',
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shared_pack_purchases',
    )
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shared_purchases',
    )
    amount_paise = models.PositiveIntegerField(
        help_text='Amount charged to the buyer in paise (1 INR = 100 paise)',
    )
    reward_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Units awarded to the sharer (credits in V1)',
    )
    reward_type = models.CharField(
        max_length=20,
        default='credits',
        help_text='Type of reward: credits (V1) or cash (V2)',
    )

    # ── Click / conversion analytics ──────────────────────────────────────────────
    clicked_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the buyer first opened the share landing page',
    )
    purchased_at = models.DateTimeField(auto_now_add=True)
    conversion_time = models.DurationField(
        null=True,
        blank=True,
        help_text='Time from first click to completed purchase (purchased_at - clicked_at)',
    )

    # ── Source / device analytics ─────────────────────────────────────────────────
    referrer = models.CharField(
        max_length=500,
        blank=True,
        help_text='HTTP Referer header or UTM source at click time',
    )
    device = models.CharField(
        max_length=50,
        blank=True,
        help_text='mobile | tablet | desktop — parsed from User-Agent',
    )
    browser = models.CharField(
        max_length=100,
        blank=True,
        help_text='Browser name parsed from User-Agent (e.g. Chrome, Safari)',
    )
    country = models.CharField(
        max_length=2,
        blank=True,
        help_text='ISO 3166-1 alpha-2 country code from CF-IPCountry header or blank',
    )

    class Meta:
        ordering = ['-purchased_at']
        # One purchase per (buyer, share_link) pair — prevents duplicate purchases.
        unique_together = [('share_link', 'buyer')]
        indexes = [
            models.Index(fields=['buyer', 'purchased_at'], name='scrib_sharedpurch_buyer_idx'),
            models.Index(fields=['share_link', 'purchased_at'], name='scrib_sharedpurch_link_idx'),
        ]

    def __str__(self):
        return f'Purchase by {self.buyer_id} via {self.share_link.share_code}'


# -----------------------------------------------------------------------------
# Influencer Referral Program Models
# -----------------------------------------------------------------------------

class Influencer(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_PAUSED = 'paused'
    STATUS_DISABLED = 'disabled'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PAUSED, 'Paused'),
        (STATUS_DISABLED, 'Disabled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    instagram_username = models.CharField(max_length=100, blank=True, null=True)

    referral_code = models.CharField(max_length=50, unique=True, db_index=True)
    dashboard_token = models.CharField(max_length=64, unique=True, db_index=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.referral_code})"


class InfluencerClick(models.Model):
    influencer = models.ForeignKey(Influencer, on_delete=models.CASCADE, related_name='clicks')
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    visitor_id = models.UUIDField(db_index=True, help_text='Frontend generated UUID for deduplication')
    clicked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-clicked_at']
        indexes = [
            models.Index(fields=['influencer', 'visitor_id', 'clicked_at']),
        ]

    def __str__(self):
        return f"Click on {self.influencer.referral_code} by {self.visitor_id}"


class InfluencerReferral(models.Model):
    influencer = models.ForeignKey(Influencer, on_delete=models.CASCADE, related_name='referrals')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='influencer_referral_record')
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.user} referred by {self.influencer.name}"


class InfluencerCommission(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PAID = 'paid'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PAID, 'Paid'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    influencer = models.ForeignKey(Influencer, on_delete=models.CASCADE, related_name='commissions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='generated_commissions')
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='influencer_commission')
    
    payment_number = models.PositiveSmallIntegerField(help_text='1 for first payment, 2 for second payment')
    payment_amount = models.PositiveIntegerField(help_text='Amount in paise')
    
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)
    commission_amount = models.PositiveIntegerField(help_text='Commission in paise')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='paid_commissions')
    notes = models.TextField(blank=True, null=True)
    transaction_reference = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Commission for {self.influencer.name} ({self.status})"


# -----------------------------------------------------------------------------
# Content Packs — curated, paid PDF + quiz bundles (Interview Prep and beyond)
# -----------------------------------------------------------------------------

class ContentPack(models.Model):
    """One purchasable pack: a full handwritten PDF plus a set of quizzes.

    Deliberately generic. `section` is the top-level grouping shown in the
    Library ('interview' today); `category` is the subject inside it. Neither is
    an enum, so a whole new section of paid content can be added from the admin
    without a migration or a frontend deploy.

    The PDF lives in S3 under `interview-packs/` (see s3_key). Only the first
    `free_page_count` pages are ever served to a user who has not bought the
    pack — those pages are extracted once into a separate S3 object
    (s3_free_key) so the full file is never handed to the browser.
    """

    SECTION_INTERVIEW = 'interview'

    # Card/swatch theme keys — mirror the palette in PreviewCard.jsx so a pack
    # renders in the same visual language as the rest of Scrib.
    THEME_CHOICES = [
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('purple', 'Purple'),
        ('orange', 'Orange'),
        ('red', 'Red'),
        ('olive', 'Olive'),
    ]

    section = models.CharField(
        max_length=40,
        default=SECTION_INTERVIEW,
        db_index=True,
        help_text="Top-level Library grouping, e.g. 'interview'.",
    )
    category = models.CharField(
        max_length=80,
        help_text="Subject shown above the title, e.g. 'Operating Systems'.",
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')

    price_paise = models.PositiveIntegerField(
        default=9900,
        help_text='Price for this single pack, in paise (9900 = ₹99).',
    )
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='blue')

    s3_key = models.CharField(
        max_length=1024,
        blank=True,
        default='',
        help_text='S3 object key of the full PDF.',
    )
    s3_free_key = models.CharField(
        max_length=1024,
        blank=True,
        default='',
        help_text='S3 key of the extracted free-preview PDF. Regenerated when the source PDF changes.',
    )
    page_count = models.PositiveIntegerField(default=0)
    free_page_count = models.PositiveIntegerField(
        default=10,
        help_text='How many pages a user can read before paying.',
    )

    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'title']
        indexes = [
            models.Index(fields=['section', 'is_active'], name='scrib_pack_section_idx'),
            models.Index(fields=['slug'], name='scrib_cpack_slug_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:240] or 'pack'
            slug = base_slug
            counter = 1
            while ContentPack.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def quiz_count(self):
        return self.quizzes.filter(is_active=True).count()

    @property
    def question_count(self):
        return PackQuizQuestion.objects.filter(quiz__pack=self, quiz__is_active=True).count()

    def __str__(self):
        return f'{self.title} ({self.section})'


class PackBundle(models.Model):
    """A discounted 'buy the rest' offer over a set of packs.

    Two shapes, told apart by `covers_count`:

    * **Full offer** (`covers_count = 0`): a fixed set of packs listed in
      `packs`. Buying it entitles the user to every pack in that set — including
      packs added to the bundle later, so the offer keeps its promise as the
      library grows. Only shown to users who own none of the section.
    * **Top-up tier** (`covers_count = N`): shown to a user who still needs
      exactly N packs, whichever ones those are. `packs` stays empty because the
      set is per-user, so buying it grants an explicit PackPurchase row per pack
      the buyer was missing (see `grant_bundle`).

    Without the tiers, someone who had already bought one pack was still shown
    "unlock all 3 packs" — an offer that re-sold them what they owned.
    """

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    section = models.CharField(max_length=40, default=ContentPack.SECTION_INTERVIEW, db_index=True)
    price_paise = models.PositiveIntegerField(
        default=39900,
        help_text='Bundle price in paise (39900 = ₹399).',
    )
    covers_count = models.PositiveSmallIntegerField(
        default=0,
        help_text=(
            'How many still-unowned packs this offer covers. 0 = the full offer '
            'over the packs picked below, shown only to users who own none of '
            'them. Set 2 to price the "already owns one, sell the other two" '
            'top-up — leave the pack list empty for those, the packs are '
            'whichever ones the buyer is missing.'
        ),
    )
    packs = models.ManyToManyField(ContentPack, related_name='bundles', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)[:240] or 'bundle'
            slug = base_slug
            counter = 1
            while PackBundle.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def original_price_paise(self):
        """Sum of the individual prices — what the bundle is discounted against."""
        return sum(p.price_paise for p in self.packs.filter(is_active=True))

    def __str__(self):
        return f'{self.name} (₹{self.price_paise / 100:g})'


class PackQuiz(models.Model):
    """One quiz inside a pack. Ten per pack in the launch catalogue."""

    pack = models.ForeignKey(ContentPack, on_delete=models.CASCADE, related_name='quizzes')
    number = models.PositiveSmallIntegerField(help_text='Position within the pack, starting at 1.')
    title = models.CharField(max_length=255, blank=True, default='')
    topic = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Sub-line shown on the quiz card, e.g. 'Processes & scheduling'.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['pack', 'number']
        unique_together = [('pack', 'number')]
        verbose_name_plural = 'Pack quizzes'

    @property
    def question_count(self):
        return self.questions.count()

    def display_title(self):
        return self.title or f'Quiz {self.number}'

    def __str__(self):
        return f'{self.pack.title} — {self.display_title()}'


class PackQuizQuestion(models.Model):
    """A single multiple-choice question.

    `options` is a list of answer strings and `correct_index` points into it, so
    a quiz can carry three or five options without a schema change.
    """

    quiz = models.ForeignKey(PackQuiz, on_delete=models.CASCADE, related_name='questions')
    order = models.PositiveSmallIntegerField(default=0)
    text = models.TextField()
    options = models.JSONField(default=list)
    correct_index = models.PositiveSmallIntegerField(default=0)
    explanation = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['quiz', 'order', 'id']

    def __str__(self):
        return f'{self.quiz} Q{self.order}'


class PackPurchase(models.Model):
    """Proof that a user owns a pack — the entitlement the paywall checks.

    Exactly one of `pack` / `bundle` is set. A bundle row grants access to every
    pack in that bundle, so `user_owns_pack()` must check both shapes.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pack_purchases',
    )
    pack = models.ForeignKey(
        ContentPack,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='purchases',
    )
    bundle = models.ForeignKey(
        PackBundle,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='purchases',
    )
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pack_purchases',
    )
    amount_paise = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            # A user buys any given pack (or bundle) once. No `condition=` here —
            # MariaDB doesn't support conditional unique constraints and silently
            # drops them (see migration 0019's W036 warning). Plain constraints
            # work everywhere instead, because every supported DB (MySQL/MariaDB,
            # PostgreSQL, SQLite) treats NULL as distinct in a unique index: rows
            # where `pack` is NULL (bundle-only purchases) never collide with each
            # other, so this still only blocks a genuine duplicate (user, pack).
            models.UniqueConstraint(
                fields=['user', 'pack'],
                name='scrib_uniq_user_pack_purchase',
            ),
            models.UniqueConstraint(
                fields=['user', 'bundle'],
                name='scrib_uniq_user_bundle_purchase',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'created_at'], name='scrib_packpurch_user_idx'),
        ]

    def __str__(self):
        target = self.pack.title if self.pack else (self.bundle.name if self.bundle else '?')
        return f'{self.user_id} owns {target}'


class QuizAttempt(models.Model):
    """One submitted attempt. Retakes create new rows; the card shows the best."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quiz_attempts',
    )
    quiz = models.ForeignKey(PackQuiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.PositiveSmallIntegerField(default=0)
    total = models.PositiveSmallIntegerField(default=0)
    answers = models.JSONField(
        default=dict,
        blank=True,
        help_text='{question_id: chosen_index} as submitted.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'quiz'], name='scrib_attempt_user_quiz_idx'),
        ]

    def __str__(self):
        return f'{self.user_id} {self.quiz_id}: {self.score}/{self.total}'


def user_owns_pack(user, pack):
    """True when `user` has bought `pack` outright or inside a bundle."""
    if not user or not user.is_authenticated:
        return False
    return PackPurchase.objects.filter(
        Q(pack=pack) | Q(bundle__packs=pack),
        user=user,
    ).exists()


def owned_pack_ids(user):
    """Set of pack ids `user` can read in full — direct buys plus bundle grants."""
    if not user or not user.is_authenticated:
        return set()
    direct = PackPurchase.objects.filter(
        user=user, pack__isnull=False
    ).values_list('pack_id', flat=True)
    via_bundle = ContentPack.objects.filter(
        bundles__purchases__user=user
    ).values_list('id', flat=True)
    return set(direct) | set(via_bundle)


def bundle_offer_for(user, section):
    """The bundle offer to show `user` in `section`, as `(bundle, packs)`.

    `packs` is exactly what the offer would unlock — the packs they don't own
    yet — so the price, the count and the "instead of ₹X" strike-through all
    describe what they'd actually be buying.

    Returns `(None, [])` when there is nothing sensible to offer: fewer than two
    packs left (one pack is just that pack's own price, and zero means they own
    the section), or no active tier priced for the number they still need.
    """
    active = list(ContentPack.objects.filter(section=section, is_active=True))
    owned = owned_pack_ids(user)
    remaining = [p for p in active if p.id not in owned]

    if len(remaining) < 2:
        return None, []

    bundles = PackBundle.objects.filter(section=section, is_active=True)

    # A tier priced for exactly this many packs wins. Falling back to the full
    # offer is only correct when they own none of it — that is what it is priced
    # against, and its `packs` grant would hand over the whole set regardless.
    bundle = bundles.filter(covers_count=len(remaining)).first()
    if not bundle and len(remaining) == len(active):
        bundle = bundles.filter(covers_count=0).first()

    if not bundle:
        return None, []

    # The full offer's own pack list is the authority on what it unlocks; a tier
    # has no list of its own, so it unlocks whatever the buyer is missing.
    if bundle.covers_count == 0:
        offer_packs = [p for p in bundle.packs.filter(is_active=True)] or remaining
    else:
        offer_packs = remaining

    return bundle, offer_packs


def grant_bundle(user, bundle, payment=None, amount_paise=0):
    """Record a bundle purchase and make sure it actually unlocks something.

    A full offer entitles through its own `packs`, so the single bundle row is
    the entitlement. A top-up tier has no pack list — its row exists for
    revenue and for the once-only constraint — so the packs the buyer was
    missing are granted explicitly here, at the moment of purchase.
    """
    purchase, created = PackPurchase.objects.get_or_create(
        user=user,
        pack=None,
        bundle=bundle,
        defaults={'payment': payment, 'amount_paise': amount_paise},
    )

    if bundle.covers_count:
        owned = owned_pack_ids(user)
        for pack in ContentPack.objects.filter(section=bundle.section, is_active=True):
            if pack.id in owned:
                continue
            # amount stays on the bundle row above, so per-pack rows carry 0 and
            # revenue isn't counted twice.
            PackPurchase.objects.get_or_create(
                user=user, pack=pack, bundle=None,
                defaults={'payment': payment, 'amount_paise': 0},
            )

    return purchase, created
