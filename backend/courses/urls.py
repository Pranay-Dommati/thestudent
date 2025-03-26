from django.urls import path
from . import views

urlpatterns = [
    path('api/courses/create/', views.create_course, name='create-course'),
    path('api/courses/engineering/', views.list_engineering_courses, name='list-engineering-courses'),
    path('api/courses/engineering/<str:course_id>/', views.get_engineering_course_by_id, name='get-engineering-course-by-id'),
]