from django.db import models
from django.utils import timezone

class Newsletter(models.Model):
    """
    Model to store newsletter subscriber information
    """
    email = models.EmailField(unique=True, help_text="Subscriber's email address")
    subscribed_at = models.DateTimeField(default=timezone.now, help_text="Date and time when user subscribed")
    is_active = models.BooleanField(default=True, help_text="Whether the subscription is active")
    
    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = "Newsletter Subscription"
        verbose_name_plural = "Newsletter Subscriptions"
    
    def __str__(self):
        return f"{self.email} - {'Active' if self.is_active else 'Inactive'}"
