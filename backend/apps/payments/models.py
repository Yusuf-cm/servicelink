import uuid

from django.db import models

from apps.bookings.models import Booking


class MpesaTransaction(models.Model):
    """Tracks one STK Push attempt against a booking, and its eventual callback result."""

    class Status(models.TextChoices):
        PENDING = "pending", "Awaiting customer action on phone"
        SUCCESS = "success", "Payment successful"
        FAILED = "failed", "Payment failed or cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="mpesa_transactions")

    phone_number = models.CharField(max_length=15)
    amount_kes = models.DecimalField(max_digits=10, decimal_places=2)

    merchant_request_id = models.CharField(max_length=100, blank=True)
    checkout_request_id = models.CharField(max_length=100, unique=True)

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True)
    result_code = models.IntegerField(null=True, blank=True)
    result_desc = models.CharField(max_length=255, blank=True)
    raw_callback = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mpesa_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"M-Pesa txn {self.checkout_request_id} ({self.status})"
