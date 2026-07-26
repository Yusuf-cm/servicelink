from rest_framework import generics, permissions

from apps.providers.models import FundiProfile
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewSerializer, ReviewCreateSerializer
from apps.users.permissions import IsClient


class ProviderReviewListView(generics.ListAPIView):
    """Public: all reviews for a given provider, shown on their profile (proposal 4.2.2)."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        provider_id = self.kwargs["provider_id"]
        return Review.objects.filter(provider_id=provider_id).select_related("client")


class ReviewCreateView(generics.CreateAPIView):
    """REQ C-06: rate and review a provider after job completion."""

    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]


class MyReviewsView(generics.ListAPIView):
    """Reviews written by the current client, or (if provider) received by them."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_provider:
            try:
                return Review.objects.filter(provider=user.fundi_profile)
            except FundiProfile.DoesNotExist:
                return Review.objects.none()
        return Review.objects.filter(client=user)
