from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.text import slugify


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
    credits = models.PositiveIntegerField()
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
    credits_to_add = models.PositiveIntegerField(default=5)
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
    credits_added = models.PositiveIntegerField()
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
        on_delete=models.PROTECT,
        related_name='purchases',
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
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
