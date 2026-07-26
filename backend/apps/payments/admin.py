from django.contrib import admin

from apps.payments.models import MpesaTransaction


@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    list_display = ["checkout_request_id", "booking", "phone_number", "amount_kes", "status", "mpesa_receipt_number", "created_at"]
    list_filter = ["status"]
    search_fields = ["checkout_request_id", "phone_number", "mpesa_receipt_number", "booking__id"]
    readonly_fields = ["raw_callback", "created_at", "updated_at"]
