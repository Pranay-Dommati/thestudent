from django.db import models
from django.conf import settings


class UserActivity(models.Model):
    """Lightweight event log for analytics.

    Avoid storing PII or raw AI content. Use metadata for counts/lengths.
    """
    session_id = models.CharField(max_length=100, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_events",
    )
    event_type = models.CharField(max_length=100)
    feature = models.CharField(max_length=50, blank=True, null=True)
    metadata = models.JSONField(default=dict)
    latency_ms = models.IntegerField(blank=True, null=True)
    success = models.BooleanField(default=True)
    error_code = models.CharField(max_length=100, blank=True, null=True)
    client_ts = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["session_id", "created_at"]),
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["feature", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.session_id} - {self.event_type} ({self.created_at:%Y-%m-%d %H:%M:%S})"
