from rest_framework import serializers

from apps.providers.models import FundiProfile, ServiceCategory, PortfolioImage
from apps.users.serializers import UserSerializer


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "description", "requires_regulatory_credential", "icon", "is_active"]


class PortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioImage
        fields = ["id", "image", "caption", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class FundiProfileListSerializer(serializers.ModelSerializer):
    """
    Lightweight representation for search results (proposal 4.2.1: ranked
    list by trust score, showing name, category, rating, completed jobs).
    """

    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    categories = ServiceCategorySerializer(many=True, read_only=True)

    class Meta:
        model = FundiProfile
        fields = [
            "id", "full_name", "categories", "coverage_areas",
            "verification_status", "average_rating", "completed_jobs_count",
            "trust_score", "is_available",
        ]


class FundiProfileDetailSerializer(serializers.ModelSerializer):
    """Full profile view (proposal 4.2.2)."""

    user = UserSerializer(read_only=True)
    categories = ServiceCategorySerializer(many=True, read_only=True)
    portfolio_images = PortfolioImageSerializer(many=True, read_only=True)
    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = FundiProfile
        fields = [
            "id", "user", "bio", "categories", "coverage_areas",
            "years_of_experience", "is_available",
            "credential_body", "credential_number", "verification_status",
            "is_verified", "verified_at",
            "average_rating", "completed_jobs_count", "trust_score",
            "portfolio_images", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "verification_status", "is_verified", "verified_at",
            "average_rating", "completed_jobs_count", "trust_score",
            "created_at", "updated_at",
        ]


class FundiProfileUpdateSerializer(serializers.ModelSerializer):
    """
    REQ P-03: providers set their own categories, coverage area,
    availability, bio, experience. Credential fields are handled
    separately through the verification submission endpoint so that
    changing them always re-triggers a review (see apps.verification).
    """

    category_ids = serializers.PrimaryKeyRelatedField(
        source="categories", queryset=ServiceCategory.objects.filter(is_active=True), many=True, required=False,
    )

    class Meta:
        model = FundiProfile
        fields = ["bio", "category_ids", "coverage_areas", "years_of_experience", "is_available"]
