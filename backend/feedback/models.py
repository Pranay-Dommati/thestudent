from django.db import models
from django.utils import timezone

class Feedback(models.Model):
    name = models.CharField(max_length=100, help_text="Name of the person providing feedback")
    message = models.TextField(help_text="Feedback message content")
    submitted_at = models.DateTimeField(default=timezone.now, help_text="When the feedback was submitted")
    
    class Meta:
        verbose_name = "Feedback"
        verbose_name_plural = "Feedbacks"
        ordering = ['-submitted_at']  # Most recent first
    
    def __str__(self):
        return f"Feedback from {self.name} - {self.submitted_at.strftime('%Y-%m-%d %H:%M')}"
    
    def get_short_message(self):
        """Return a shortened version of the message for admin display"""
        if len(self.message) > 50:
            return self.message[:50] + "..."
        return self.message
    
    get_short_message.short_description = "Message Preview"
