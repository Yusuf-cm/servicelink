from django.utils import timezone
from rest_framework import serializers

from apps.bookings.models import ServiceRequest, Booking, Message
from apps.providers.serializers import FundiProfileListSerializer, ServiceCategorySerializer
from apps.users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "service_request", "sender", "sender_name", "body", "sent_at", "read_at"]
        read_only_fields = ["id", "sender", "sender_name", "sent_at", "read_at", "service_request"]


class ServiceRequestCreateSerializer(serializers.ModelSerializer):
    """REQ C-04."""

    class Meta:
        model = ServiceRequest
        fields = ["id", "provider", "category", "description", "location", "preferred_date"]
        read_only_fields = ["id"]

    def validate_preferred_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Preferred date cannot be in the past.")
        return value

    def validate_provider(self, value):
        if not value.is_available:
            raise serializers.ValidationError("This provider is not currently accepting new requests.")
        return value

    def create(self, validated_data):
        validated_data["client"] = self.context["request"].user
        return super().create(validated_data)


class ServiceRequestSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    provider = FundiProfileListSerializer(read_only=True)
    category = ServiceCategorySerializer(read_only=True)
    has_booking = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = [
            "id", "client", "provider", "category", "description", "location",
            "preferred_date", "status", "has_booking", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_has_booking(self, obj):
        return hasattr(obj, "booking")


class ServiceRequestDecisionSerializer(serializers.Serializer):
    """REQ: provider accepts/declines a request (proposal 4.2.3)."""

    decision = serializers.ChoiceField(choices=["accept", "decline"])
    agreed_price_kes = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    scheduled_date = serializers.DateField(required=False)

    def validate(self, attrs):
        if attrs["decision"] == "accept":
            if "agreed_price_kes" not in attrs or "scheduled_date" not in attrs:
                raise serializers.ValidationError(
                    "agreed_price_kes and scheduled_date are required to accept a request."
                )
            if attrs["agreed_price_kes"] <= 0:
                raise serializers.ValidationError({"agreed_price_kes": "Price must be greater than zero."})
            if attrs["scheduled_date"] < timezone.localdate():
                raise serializers.ValidationError({"scheduled_date": "Scheduled date cannot be in the past."})
        return attrs


class BookingSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    provider = FundiProfileListSerializer(read_only=True)
    service_request = ServiceRequestSerializer(read_only=True)
    has_review = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "service_request", "client", "provider", "agreed_price_kes",
            "scheduled_date", "status", "payment_status", "has_review",
            "created_at", "confirmed_at", "completed_at", "cancelled_at",
        ]
        read_only_fields = fields


class BookingStatusUpdateSerializer(serializers.Serializer):
    """Provider marks a confirmed booking as in-progress or completed."""

    status = serializers.ChoiceField(choices=[Booking.Status.IN_PROGRESS, Booking.Status.COMPLETED])
