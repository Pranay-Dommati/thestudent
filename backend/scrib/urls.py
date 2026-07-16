from django.urls import path
# pyrefly: ignore [missing-import]
from . import views
# pyrefly: ignore [missing-import]
from .views import (
    ShareCreateView, ShareMetaView, SharePreviewView,
    SharePurchaseOrderView, SharePaymentVerifyView, SharingStatsView,
    SharePackPdfView,
)

app_name = 'scrib'

urlpatterns = [
    path('previews/', views.PreviewListView.as_view(), name='preview-list'),
    path('previews/<slug:slug>/', views.PreviewDetailView.as_view(), name='preview-detail'),
    path('generate-note/', views.GenerateNoteView.as_view(), name='generate-note'),
    path('generate-study-pack/', views.GenerateStudyPackView.as_view(), name='generate-study-pack'),
    path('organize-topics/', views.OrganizeTopicsView.as_view(), name='organize-topics'),
    path('parse-syllabus/', views.ParseSyllabusView.as_view(), name='parse-syllabus'),
    path('moderate-topics/', views.ModerateTopicsView.as_view(), name='moderate-topics'),
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
    path('packs/<int:pack_id>/status/', views.StudyPackStatusView.as_view(), name='pack-status'),
    path('packs/share/<uuid:share_token>/', views.StudyPackShareView.as_view(), name='pack-share'),
    
    # Support
    path('support/', views.ContactSupportView.as_view(), name='support'),

    # Promo / Coupon codes
    path('redeem-coupon/', views.RedeemCouponView.as_view(), name='redeem-coupon'),
    path('admin/promo-codes/', views.AdminPromoCodeListView.as_view(), name='admin-promo-codes'),
    path('admin/promo-codes/stats/', views.AdminPromoCodeStatsView.as_view(), name='admin-promo-codes-stats'),
    path('admin/promo-codes/<int:pk>/', views.AdminPromoCodeDetailView.as_view(), name='admin-promo-code-detail'),
    path('admin/user-insights/', views.AdminUserInsightsView.as_view(), name='admin-user-insights'),
    path('admin/paid-analytics/', views.AdminPaidUsersAnalyticsView.as_view(), name='admin-paid-analytics'),
    path('admin/packs/<int:pack_id>/pdf/', views.AdminStudyPackPdfView.as_view(), name='admin-pack-pdf'),

    # Cohort config
    path('config/', views.ScribConfigPublicView.as_view(), name='scrib-config-public'),
    path('admin/config/', views.AdminScribConfigView.as_view(), name='admin-scrib-config'),

    # ── Earn While Learning ───────────────────────────────────────────────────────────────
    # Order matters: specific paths (create, stats, payment-verify, preview) must
    # come BEFORE the wildcard <str:share_code> pattern.
    path('share/create/',                         ShareCreateView.as_view(),         name='share-create'),
    path('share/stats/',                          SharingStatsView.as_view(),        name='share-stats'),
    path('share/payment-verify/',                 SharePaymentVerifyView.as_view(),  name='share-payment-verify'),
    path('share/preview/<str:preview_token>/',    SharePreviewView.as_view(),        name='share-preview'),
    path('share/<str:share_code>/pdf/',           SharePackPdfView.as_view(),        name='share-pack-pdf'),
    path('share/<str:share_code>/purchase/',      SharePurchaseOrderView.as_view(),  name='share-purchase'),
    path('share/<str:share_code>/',               ShareMetaView.as_view(),           name='share-meta'),
]
