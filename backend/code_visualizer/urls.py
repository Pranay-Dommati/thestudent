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
    path('generate-explanations/', views.generate_explanations, name='generate_explanations'),
    path('generate-explanations-stream/', views.generate_explanations_stream, name='generate_explanations_stream'),
    
    # Input detection and generation
    path('detect-inputs/', views.detect_inputs, name='detect_inputs'),
    path('generate-inputs/', views.generate_smart_inputs, name='generate_inputs'),
    
    # Code validation
    path('validate/', views.validate_code_endpoint, name='validate'),
    
    # "The Why" — Line-specific explanations
    path('generate-why/', views.generate_why_explanation, name='generate_why_explanation'),
    
    # "Ask Step" — Contextual Q&A about a step
    path('ask-step/', views.ask_step, name='ask_step'),
]
