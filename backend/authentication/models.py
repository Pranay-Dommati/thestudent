from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

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
    
    # Educational Information
    class_level = models.CharField(max_length=50, choices=[
        ('10th', '10th Grade'),
        ('11th', '11th Grade'),
        ('12th', '12th Grade'),
        ('other', 'Other')
    ], null=True, blank=True)
    
    board_of_education = models.CharField(max_length=100, choices=[
        ('cbse', 'CBSE'),
        ('state_board', 'State Board')
    ], null=True, blank=True)
    
    # Location Information
    country = models.CharField(max_length=100, null=True, blank=True)
    
    # Terms and Conditions
    agreed_to_terms = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    objects = UserManager()
    
    def __str__(self):
        return self.email
