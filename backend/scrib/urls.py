from django.urls import path
from . import views

app_name = 'scrib'

urlpatterns = [
    path('previews/', views.PreviewListView.as_view(), name='preview-list'),
    path('previews/<slug:slug>/', views.PreviewDetailView.as_view(), name='preview-detail'),
    path('generate-note/', views.GenerateNoteView.as_view(), name='generate-note'),
    path('generate-study-pack/', views.GenerateStudyPackView.as_view(), name='generate-study-pack'),
    path('organize-topics/', views.OrganizeTopicsView.as_view(), name='organize-topics'),
    # Payment endpoints
    path('payments/create-order/', views.CreateOrderView.as_view(), name='payments-create-order'),
    path('payments/verify/', views.VerifyPaymentView.as_view(), name='payments-verify'),
    path('payments/history/', views.PaymentHistoryView.as_view(), name='payments-history'),
    path('payments/webhook/', views.razorpay_webhook, name='payments-webhook'),
    # User data
    path('me/', views.MeView.as_view(), name='me'),
    path('my-notes/', views.MyNotesView.as_view(), name='my-notes'),
    path('my-study-packs/', views.MyStudyPacksView.as_view(), name='my-study-packs'),
    path('packs/<int:pack_id>/pdf/', views.StudyPackPdfView.as_view(), name='pack-pdf'),
]
