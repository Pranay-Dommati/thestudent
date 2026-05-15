from django.contrib import admin
from .models import PreviewNote, GeneratedNote, StudyPack, Payment, CreditTransaction


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
