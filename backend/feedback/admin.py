from django.contrib import admin
from .models import Feedback

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """
    Admin configuration for Feedback model
    """
    # Fields to display in the list view
    list_display = [
        'name', 
        'get_short_message', 
        'submitted_at', 
        'formatted_date'
    ]
    
    # Fields to search by
    search_fields = ['name', 'message']
    
    # Filters in the right sidebar
    list_filter = [
        'submitted_at',
        ('submitted_at', admin.DateFieldListFilter),
    ]
    
    # Read-only fields
    readonly_fields = ['submitted_at', 'formatted_date']
    
    # Fields to show in the detail view
    fields = ['name', 'message', 'submitted_at', 'formatted_date']
    
    # Ordering (most recent first)
    ordering = ['-submitted_at']
    
    # Number of items per page
    list_per_page = 25
    
    # Date hierarchy for easy navigation
    date_hierarchy = 'submitted_at'
    
    def formatted_date(self, obj):
        """Return a nicely formatted date"""
        return obj.submitted_at.strftime('%B %d, %Y at %I:%M %p')
    formatted_date.short_description = 'Submitted Date'
    formatted_date.admin_order_field = 'submitted_at'
    
    def has_add_permission(self, request):
        """Disable adding feedback through admin (should come from frontend)"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion of feedback"""
        return True
    
    def has_change_permission(self, request, obj=None):
        """Allow viewing/editing feedback"""
        return True
    
    # Custom actions
    actions = ['mark_as_reviewed']
    
    def mark_as_reviewed(self, request, queryset):
        """Custom action (you can extend this to add a 'reviewed' field)"""
        self.message_user(request, f"Marked {queryset.count()} feedback(s) as reviewed.")
    mark_as_reviewed.short_description = "Mark selected feedbacks as reviewed"
