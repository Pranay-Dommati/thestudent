from django.urls import path
# pyrefly: ignore [missing-import]
from .views import payment_info

urlpatterns = [
    path('', payment_info, name='payment-info'),
]
