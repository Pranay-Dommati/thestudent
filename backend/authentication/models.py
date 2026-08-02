from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings

class UserManager(BaseUserManager):
    """Define a model manager for User model with email as the unique identifier"""
    def create_user(self, email, full_name, password=None, **extra_fields):
        """Create and save a User with the given email, full name and password"""
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        """Create and save a SuperUser with the given email, full name and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, full_name, password, **extra_fields)

class User(AbstractUser):
    """Custom User model that uses email as the unique identifier"""
    username = None
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(max_length=255)
    
    # Authentication method tracking
    AUTH_METHOD_CHOICES = [
        ('email', 'Email/Password'),
        ('google', 'Google OAuth'),
    ]
    auth_method = models.CharField(
        max_length=20, 
        choices=AUTH_METHOD_CHOICES, 
        default='email',
        help_text='Method used for initial registration'
    )
    
    # Terms and Conditions
    agreed_to_terms = models.BooleanField(default=False)
    
    # Onboarding tracking
    has_seen_onboarding = models.BooleanField(default=False, help_text='Whether user has seen the onboarding modal')
    
    # Signup origin tracking
    SIGNUP_SOURCE_CHOICES = [
        ('courses', 'Courses'),
        ('codevisualizer', 'Code Visualizer'),
        ('scrib', 'Scrib'),
        ('main', 'Main Website')
    ]
    signup_source = models.CharField(
        max_length=50,
        choices=SIGNUP_SOURCE_CHOICES,
        default='main',
        help_text='Which product the user originally signed up from'
    )

    # Scrib cohort tracking — set at account activation (OTP or Google)
    signup_cohort = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text='Scrib marketing cohort active when this user first signed up (preview | free_credit | null if pre-dates cohort tracking)',
    )

    # Influencer Referral Tracking
    referred_by_influencer = models.ForeignKey(
        'scrib.Influencer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referred_users',
        help_text='The influencer who referred this user (set once at signup)'
    )

    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    objects = UserManager()
    
    def __str__(self):
        return self.email


class EmailOTP(models.Model):
    """One-time password for email verification during signup.
    Only the most recent, unused, unexpired code should be accepted.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_otps'
    )
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_sent_at = models.DateTimeField(auto_now_add=True)
    resend_count = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_used', 'expires_at'], name='idx_otp_user_state'),
            models.Index(fields=['created_at'], name='idx_otp_created_at'),
        ]
        ordering = ['-created_at']

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def mark_used(self):
        if not self.is_used:
            self.is_used = True
            self.save(update_fields=['is_used'])


class UserProduct(models.Model):
    """Tracks which products a user has accessed within the ecosystem."""
    PRODUCT_CHOICES = [
        ('courses', 'Courses'),
        ('codevisualizer', 'Code Visualizer'),
        ('scrib', 'Scrib')
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='products'
    )
    product = models.CharField(max_length=50, choices=PRODUCT_CHOICES)
    first_used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-first_used_at']

    def __str__(self):
        return f"{self.user.email} - {self.get_product_display()}"
