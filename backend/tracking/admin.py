from django.contrib import admin
from .models import UserActivity


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ("created_at", "event_type", "feature", "user", "session_id", "success", "latency_ms")
    list_filter = ("event_type", "feature", "success", "created_at")
    search_fields = ("session_id", "event_type", "feature", "metadata")
    ordering = ("-created_at",)
