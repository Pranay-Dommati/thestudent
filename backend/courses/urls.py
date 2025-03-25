from django.urls import path
from . import views

urlpatterns = [
    path('api/courses/create/', views.create_course, name='create-course'),
    path('api/courses/engineering/', views.list_engineering_courses, name='list-engineering-courses'),
]