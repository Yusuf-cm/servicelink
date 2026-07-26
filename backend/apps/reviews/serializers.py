from rest_framework import serializers

from apps.bookings.models import Booking
from apps.reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.get_full_name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "booking", "client", "client_name", "provider", "rating", "comment", "created_at"]
        read_only_fields = ["id", "client", "client_name", "provider", "created_at"]


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "booking", "rating", "comment"]
        read_only_fields = ["id"]

    def validate_booking(self, booking):
        request = self.context["request"]

        if booking.client != request.user:
            raise serializers.ValidationError("You can only review your own bookings.")
        if booking.status != Booking.Status.COMPLETED:
            raise serializers.ValidationError("Only completed bookings can be reviewed.")
        if hasattr(booking, "review"):
            raise serializers.ValidationError("This booking has already been reviewed.")
        return booking

    def create(self, validated_data):
        booking = validated_data["booking"]
        review = Review.objects.create(
            booking=booking,
            client=booking.client,
            provider=booking.provider,
            rating=validated_data["rating"],
            comment=validated_data.get("comment", ""),
        )
        _recalculate_provider_rating(booking.provider)
        return review


def _recalculate_provider_rating(provider):
    """Proposal 4.2.4: 'contributes to their overall trust score', 4.4 TC-09: 'trust score recalculated'."""
    from django.db.models import Avg

    aggregate = provider.reviews_received.aggregate(avg=Avg("rating"))
    provider.average_rating = round(aggregate["avg"] or 0, 2)
    provider.save(update_fields=["average_rating"])
    provider.recalculate_trust_score()
