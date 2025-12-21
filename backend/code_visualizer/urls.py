"""
Code Visualizer URL Configuration
=================================
URL patterns for the code visualizer API endpoints.
"""

from django.urls import path
from . import views

app_name = 'code_visualizer'

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Code execution and tracing
    path('execute/', views.execute_code, name='execute'),
    path('trace/', views.trace_endpoint, name='trace'),
    path('trace-stream/', views.trace_stream, name='trace_stream'),
    
    # Input detection
    path('detect-inputs/', views.detect_inputs, name='detect_inputs'),
    
    # Code validation
    path('validate/', views.validate_code_endpoint, name='validate'),
]
