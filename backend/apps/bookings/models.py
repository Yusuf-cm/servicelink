import uuid

from django.conf import settings
from django.db import models

from apps.providers.models import FundiProfile, ServiceCategory


class ServiceRequest(models.Model):
    """
    REQ C-04: client submits a service request with description and
    preferred date, targeted at a specific provider. Proposal 4.2.3: the
    provider then accepts or declines; acceptance creates a Booking.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CANCELLED = "cancelled", "Cancelled by client"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="service_requests")
    provider = models.ForeignKey(FundiProfile, on_delete=models.CASCADE, related_name="incoming_requests")
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="service_requests")

    description = models.TextField()
    location = models.CharField(max_length=255, help_text="Job address or neighbourhood, e.g. 'Westlands'.")
    preferred_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_requests"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"Request<{self.client} -> {self.provider}, {self.status}>"


class Message(models.Model):
    """REQ C-05: clients can message providers before confirming a booking."""

    service_request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "messages"
        ordering = ["sent_at"]

    def __str__(self):
        return f"Message from {self.sender} on request {self.service_request_id}"


class Booking(models.Model):
    """
    Created once a ServiceRequest is accepted (proposal 3.5). Tracks
    payment and completion. REQ C-07: clients track booking status from
    request to completion. REQ C-08: paid via M-Pesa (see apps.payments).
    """

    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Pending Payment"
        CONFIRMED = "confirmed", "Confirmed"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_request = models.OneToOneField(ServiceRequest, on_delete=models.PROTECT, related_name="booking")
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings_as_client")
    provider = models.ForeignKey(FundiProfile, on_delete=models.CASCADE, related_name="bookings_as_provider")

    agreed_price_kes = models.DecimalField(max_digits=10, decimal_places=2)
    scheduled_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    payment_status = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)

    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "bookings"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["payment_status"]),
        ]

    def __str__(self):
        return f"Booking<{self.client} x {self.provider}, {self.status}>"

    @property
    def has_review(self):
        return hasattr(self, "review")
