from django.urls import path
from .views import track_activity, track_activity_bulk, recent_events

urlpatterns = [
    path('track-activity/', track_activity, name='track-activity'),
    path('track-activity/bulk/', track_activity_bulk, name='track-activity-bulk'),
    path('recent-events/', recent_events, name='recent-events'),
]
