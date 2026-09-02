from django.contrib import admin
# pyrefly: ignore [missing-import]
from .models import (
    PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction,
    PromoCode, PromoCodeRedemption, ExternalClientPayment, NoteShareLink, SharedPackPurchase,
    ContentPack, PackBundle, PackQuiz, PackQuizQuestion, PackPurchase, QuizAttempt,
    FreePackOffer, FreePackClaim,
)


@admin.register(PreviewNote)
class PreviewNoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'page_count', 'has_pdf', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    fields = ('title', 'slug', 'tags', 'pdf_url', 'image_url', 'page_count', 'is_active')

    @admin.display(boolean=True, description='PDF set')
    def has_pdf(self, obj):
        return bool(obj.pdf_url)


@admin.register(GeneratedNote)
class GeneratedNoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'source', 'credits_used', 'created_at')
    list_filter = ('source',)
    search_fields = ('prompt', 'normalized_prompt', 'user__email')
    readonly_fields = ('created_at',)


@admin.register(StudyPack)
class StudyPackAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'status', 'total_pages', 'created_at')
    list_filter = ('status',)
    search_fields = ('title', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('razorpay_order_id', 'user', 'amount', 'credits_added', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('razorpay_order_id', 'razorpay_payment_id', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'direction', 'credits', 'reason', 'created_at')
    list_filter = ('direction', 'reason')
    search_fields = ('user__email',)
    readonly_fields = ('created_at',)


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'campaign_name', 'credits_to_add', 'times_redeemed', 'max_redemptions', 'is_active', 'expires_at', 'created_at')
    list_filter = ('is_active', 'campaign_name')
    search_fields = ('code', 'campaign_name')
    readonly_fields = ('created_at', 'times_redeemed')


@admin.register(PromoCodeRedemption)
class PromoCodeRedemptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'promo_code', 'user', 'credits_added', 'redeemed_at')
    list_filter = ('promo_code__campaign_name',)
    search_fields = ('promo_code__code', 'user__email')
    readonly_fields = ('redeemed_at',)


@admin.register(ExternalClientPayment)
class ExternalClientPaymentAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'amount', 'date', 'created_by', 'created_at')
    list_filter = ('date',)
    search_fields = ('name', 'email', 'notes')
    readonly_fields = ('created_at',)


# ─── Earn While Learning ─────────────────────────────────────────────────────

@admin.register(NoteShareLink)
class NoteShareLinkAdmin(admin.ModelAdmin):
    list_display = (
        'share_code', 'owner_email', 'pack_title', 'purchase_count',
        'reward_amount', 'reward_type', 'is_active', 'created_at',
    )
    list_filter = ('is_active', 'reward_type', 'created_at')
    search_fields = ('share_code', 'owner__email', 'study_pack__title')
    readonly_fields = ('share_code', 'created_at', 'purchase_count', 'reward_amount')
    ordering = ('-created_at',)

    @admin.display(description='Owner')
    def owner_email(self, obj):
        return obj.owner.email

    @admin.display(description='Pack Title')
    def pack_title(self, obj):
        return obj.study_pack.title

    actions = ['deactivate_links']

    @admin.action(description='Deactivate selected share links')
    def deactivate_links(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} share link(s) deactivated.')


@admin.register(SharedPackPurchase)
class SharedPackPurchaseAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'buyer_email', 'sharer_email', 'pack_title',
        'amount_inr', 'reward_amount', 'reward_type',
        'purchased_at', 'conversion_time_display',
        'device', 'browser', 'country', 'referrer_short',
    )
    list_filter = ('reward_type', 'device', 'country', 'purchased_at')
    search_fields = (
        'buyer__email',
        'share_link__owner__email',
        'share_link__study_pack__title',
        'share_link__share_code',
    )
    readonly_fields = (
        'purchased_at', 'clicked_at', 'conversion_time',
        'device', 'browser', 'country', 'referrer',
        'reward_amount', 'reward_type', 'amount_paise',
    )
    ordering = ('-purchased_at',)

    @admin.display(description='Buyer')
    def buyer_email(self, obj):
        return obj.buyer.email

    @admin.display(description='Sharer')
    def sharer_email(self, obj):
        return obj.share_link.owner.email

    @admin.display(description='Pack')
    def pack_title(self, obj):
        return obj.share_link.study_pack.title

    @admin.display(description='Amount (₹)')
    def amount_inr(self, obj):
        return f'₹{obj.amount_paise / 100:.0f}'

    @admin.display(description='Conv. Time')
    def conversion_time_display(self, obj):
        if obj.conversion_time is None:
            return '—'
        total_seconds = int(obj.conversion_time.total_seconds())
        if total_seconds < 60:
            return f'{total_seconds}s'
        minutes = total_seconds // 60
        return f'{minutes}m {total_seconds % 60}s'

    @admin.display(description='Referrer')
    def referrer_short(self, obj):
        return (obj.referrer or '')[:60] + ('…' if len(obj.referrer or '') > 60 else '')



# ── Content packs (Interview Prep) ────────────────────────────────────────────

class PackQuizQuestionInline(admin.TabularInline):
    model = PackQuizQuestion
    extra = 0
    fields = ('order', 'text', 'options', 'correct_index', 'explanation')


class PackQuizInline(admin.TabularInline):
    model = PackQuiz
    extra = 0
    fields = ('number', 'title', 'topic', 'is_active')
    show_change_link = True


@admin.register(ContentPack)
class ContentPackAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'section', 'category', 'price_inr', 'page_count',
        'free_page_count', 'quiz_total', 'has_pdf', 'is_active', 'sort_order',
    )
    list_filter = ('section', 'is_active', 'theme')
    search_fields = ('title', 'category', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PackQuizInline]
    readonly_fields = ('page_count', 's3_key', 's3_free_key', 'created_at', 'updated_at')

    @admin.display(description='Price')
    def price_inr(self, obj):
        return f'₹{obj.price_paise / 100:g}'

    @admin.display(description='Quizzes')
    def quiz_total(self, obj):
        return obj.quizzes.count()

    @admin.display(boolean=True, description='PDF')
    def has_pdf(self, obj):
        return bool(obj.s3_key)


@admin.register(PackBundle)
class PackBundleAdmin(admin.ModelAdmin):
    list_display = ('name', 'section', 'price_inr', 'offer_scope', 'pack_total', 'is_active')
    list_filter = ('section', 'is_active', 'covers_count')
    filter_horizontal = ('packs',)
    prepopulated_fields = {'slug': ('name',)}

    @admin.display(description='Price')
    def price_inr(self, obj):
        return f'₹{obj.price_paise / 100:g}'

    @admin.display(description='Shown to')
    def offer_scope(self, obj):
        if not obj.covers_count:
            return 'Users who own none of it'
        return f'Users still missing {obj.covers_count} packs'

    @admin.display(description='Packs')
    def pack_total(self, obj):
        return obj.packs.count()


@admin.register(PackQuiz)
class PackQuizAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'pack', 'number', 'topic', 'question_total', 'is_active')
    list_filter = ('is_active', 'pack__section', 'pack')
    search_fields = ('title', 'topic', 'pack__title')
    inlines = [PackQuizQuestionInline]

    @admin.display(description='Questions')
    def question_total(self, obj):
        return obj.questions.count()


@admin.register(PackPurchase)
class PackPurchaseAdmin(admin.ModelAdmin):
    list_display = ('user', 'target', 'amount_inr', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'pack__title', 'bundle__name')
    raw_id_fields = ('user', 'pack', 'bundle', 'payment')

    @admin.display(description='Item')
    def target(self, obj):
        return obj.pack.title if obj.pack else (obj.bundle.name if obj.bundle else '—')

    @admin.display(description='Amount')
    def amount_inr(self, obj):
        return f'₹{obj.amount_paise / 100:g}'


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'total', 'created_at')
    list_filter = ('created_at', 'quiz__pack')
    search_fields = ('user__email',)
    raw_id_fields = ('user', 'quiz')


@admin.register(FreePackOffer)
class FreePackOfferAdmin(admin.ModelAdmin):
    """The promo is normally driven from /admin-p; this is the fallback."""

    list_display = ('__str__', 'is_active', 'total_slots', 'claimed', 'left', 'updated_at')
    readonly_fields = ('updated_at',)

    @admin.display(description='Claimed')
    def claimed(self, obj):
        return obj.claimed_count

    @admin.display(description='Remaining')
    def left(self, obj):
        return obj.remaining

    def has_add_permission(self, request):
        # Singleton — pk=1 is created on first access by FreePackOffer.get().
        return not FreePackOffer.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(FreePackClaim)
class FreePackClaimAdmin(admin.ModelAdmin):
    list_display = ('user', 'pack', 'created_at')
    list_filter = ('created_at', 'pack')
    search_fields = ('user__email', 'pack__title')
    raw_id_fields = ('user', 'pack', 'purchase')
