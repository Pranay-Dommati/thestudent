from django.urls import path
from . import views

urlpatterns = [
    path('api/courses/create/', views.create_course, name='create-course'),
]