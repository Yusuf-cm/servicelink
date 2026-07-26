from django_filters import rest_framework as filters
from rest_framework import generics, viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from apps.providers.models import FundiProfile, ServiceCategory, PortfolioImage
from apps.providers.serializers import (
    FundiProfileListSerializer,
    FundiProfileDetailSerializer,
    FundiProfileUpdateSerializer,
    ServiceCategorySerializer,
    PortfolioImageSerializer,
)
from apps.users.permissions import IsProvider


class FundiProfileFilter(filters.FilterSet):
    """REQ C-02: search providers by trade category and location."""

    category = filters.CharFilter(field_name="categories__slug", lookup_expr="iexact")
    location = filters.CharFilter(method="filter_location")
    min_rating = filters.NumberFilter(field_name="average_rating", lookup_expr="gte")
    verified_only = filters.BooleanFilter(method="filter_verified_only")

    class Meta:
        model = FundiProfile
        fields = ["category", "location", "min_rating", "verified_only", "is_available"]

    def filter_location(self, queryset, name, value):
        return queryset.filter(coverage_areas__icontains=value)

    def filter_verified_only(self, queryset, name, value):
        if value:
            return queryset.filter(verification_status=FundiProfile.VerificationStatus.VERIFIED)
        return queryset


class ServiceCategoryListView(generics.ListAPIView):
    """Public list of the trade categories supported (proposal 1.5)."""

    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class FundiProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public search + detail view of providers, ranked by trust_score
    (proposal 4.2.1: "Providers are ordered using a trust score that
    combines their verification status and review ratings.").
    """

    queryset = FundiProfile.objects.select_related("user").prefetch_related("categories", "portfolio_images")
    permission_classes = [permissions.AllowAny]
    filterset_class = FundiProfileFilter
    search_fields = ["user__first_name", "user__last_name", "bio"]
    ordering_fields = ["trust_score", "average_rating", "completed_jobs_count"]
    ordering = ["-trust_score"]

    def get_serializer_class(self):
        if self.action == "list":
            return FundiProfileListSerializer
        return FundiProfileDetailSerializer


class MyFundiProfileView(generics.RetrieveUpdateAPIView):
    """A provider managing their own profile (REQ P-03)."""

    serializer_class = FundiProfileUpdateSerializer
    permission_classes = [IsProvider]

    def get_object(self):
        return self.request.user.fundi_profile

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response(FundiProfileDetailSerializer(instance).data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(FundiProfileDetailSerializer(instance).data)


class PortfolioImageUploadView(generics.ListCreateAPIView):
    """REQ P-04: upload portfolio images and descriptions."""

    serializer_class = PortfolioImageSerializer
    permission_classes = [IsProvider]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return PortfolioImage.objects.filter(provider=self.request.user.fundi_profile)

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user.fundi_profile)


class PortfolioImageDeleteView(generics.DestroyAPIView):
    serializer_class = PortfolioImageSerializer
    permission_classes = [IsProvider]

    def get_queryset(self):
        return PortfolioImage.objects.filter(provider=self.request.user.fundi_profile)
