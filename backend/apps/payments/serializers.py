from rest_framework import serializers

from apps.payments.models import MpesaTransaction


class InitiatePaymentSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField()
    phone_number = serializers.CharField(
        max_length=15, help_text="M-Pesa phone number to receive the STK push, e.g. 0712345678 or +254712345678.",
    )


class MpesaTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaTransaction
        fields = [
            "id", "booking", "phone_number", "amount_kes", "status",
            "mpesa_receipt_number", "result_desc", "created_at", "updated_at",
        ]
        read_only_fields = fields
