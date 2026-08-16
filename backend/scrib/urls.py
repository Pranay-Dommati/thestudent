from django.urls import path
# pyrefly: ignore [missing-import]
from . import views
# pyrefly: ignore [missing-import]
from .views import (
    ShareCreateView, ShareMetaView, SharePreviewView,
    SharePurchaseOrderView, SharePaymentVerifyView, SharingStatsView,
    SharePackPdfView,
)
# pyrefly: ignore [missing-import]
from . import pack_views

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
    path('packs/merge/', views.MergeStudyPacksView.as_view(), name='pack-merge'),
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
    path('admin/packs-by-date/', views.AdminPacksByDateView.as_view(), name='admin-packs-by-date'),
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
    
    # ── Content packs (Interview Prep) ────────────────────────────────────────
    # Static segments first — 'mine', 'purchase' and 'quizzes' must not be
    # swallowed by the <slug:slug> pattern below them.
    path('packs/catalogue/',                     pack_views.PackListView.as_view(),          name='pack-list'),
    path('packs/mine/',                          pack_views.MyPacksView.as_view(),           name='pack-mine'),
    path('packs/purchase/',                      pack_views.PackPurchaseOrderView.as_view(), name='pack-purchase'),
    path('packs/purchase/verify/',               pack_views.PackPurchaseVerifyView.as_view(),name='pack-purchase-verify'),
    path('packs/quizzes/<int:quiz_id>/',         pack_views.PackQuizQuestionsView.as_view(), name='pack-quiz'),
    path('packs/quizzes/<int:quiz_id>/submit/',  pack_views.PackQuizSubmitView.as_view(),    name='pack-quiz-submit'),
    path('packs/<slug:slug>/',                   pack_views.PackDetailView.as_view(),        name='pack-detail'),
    path('packs/<slug:slug>/pdf/',               pack_views.PackPdfView.as_view(),           name='pack-pdf-public'),

    # Content pack administration (/admin-p → Interview Prep)
    path('admin/packs/',                         pack_views.AdminPackListView.as_view(),      name='admin-pack-list'),
    path('admin/packs/analytics/',               pack_views.AdminPackAnalyticsView.as_view(), name='admin-pack-analytics'),
    path('admin/packs/<int:pk>/',                pack_views.AdminPackDetailView.as_view(),    name='admin-pack-detail'),
    path('admin/packs/<int:pk>/pdf-upload/',     pack_views.AdminPackPdfUploadView.as_view(), name='admin-pack-pdf-upload'),
    path('admin/packs/<int:pk>/quizzes/',        pack_views.AdminPackQuizListView.as_view(),  name='admin-pack-quizzes'),
    path('admin/packs/<int:pk>/quizzes/import-csv/', pack_views.AdminPackQuizCsvImportView.as_view(), name='admin-pack-quiz-csv-import'),
    path('admin/quizzes/<int:pk>/',              pack_views.AdminQuizDetailView.as_view(),    name='admin-quiz-detail'),
    path('admin/quizzes/<int:pk>/shuffle-options/', pack_views.AdminQuizShuffleOptionsView.as_view(), name='admin-quiz-shuffle-options'),
    path('admin/quizzes/<int:pk>/questions/',    pack_views.AdminQuizQuestionsView.as_view(), name='admin-quiz-questions'),
    path('admin/questions/<int:pk>/',            pack_views.AdminQuestionDetailView.as_view(),name='admin-question-detail'),
    path('admin/bundles/',                       pack_views.AdminBundleListView.as_view(),    name='admin-bundle-list'),
    path('admin/bundles/<int:pk>/',              pack_views.AdminBundleDetailView.as_view(),  name='admin-bundle-detail'),

    # Influencer Referral System
    path('influencers/click/', views.track_influencer_click, name='influencers-click'),
    path('influencers/dashboard/<str:token>/', views.influencer_dashboard, name='influencer-dashboard'),
    path('admin/influencers/', views.admin_influencers_list, name='admin-influencers-list'),
    path('admin/influencers/<uuid:pk>/', views.admin_influencer_detail, name='admin-influencer-detail'),
    path('admin/influencers/commissions/<int:pk>/pay/', views.admin_mark_commission_paid, name='admin-mark-commission-paid'),
]
