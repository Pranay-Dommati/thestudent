from django.conf import settings
from django.db import models
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

    REASON_CHOICES = [
        (REASON_PAYMENT, 'Payment'),
        (REASON_GENERATION, 'Generation'),
        (REASON_ADJUSTMENT, 'Adjustment'),
        (REASON_REFUND, 'Refund'),
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
