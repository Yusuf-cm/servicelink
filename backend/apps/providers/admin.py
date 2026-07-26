from django.contrib import admin

from apps.providers.models import ServiceCategory, FundiProfile, PortfolioImage


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "requires_regulatory_credential", "is_active"]
    prepopulated_fields = {"slug": ("name",)}
    list_filter = ["requires_regulatory_credential", "is_active"]


class PortfolioImageInline(admin.TabularInline):
    model = PortfolioImage
    extra = 0


@admin.register(FundiProfile)
class FundiProfileAdmin(admin.ModelAdmin):
    """
    Admin verification workflow (proposal 4.1: "The administrator then
    checks this number against official public records and updates the
    provider's verification status through the Django admin panel.")
    """

    list_display = [
        "user", "verification_status", "credential_body", "credential_number",
        "average_rating", "trust_score", "is_available",
    ]
    list_filter = ["verification_status", "credential_body", "is_available"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "credential_number"]
    readonly_fields = ["average_rating", "completed_jobs_count", "trust_score", "created_at", "updated_at"]
    filter_horizontal = ["categories"]
    inlines = [PortfolioImageInline]
    actions = ["mark_verified", "mark_rejected"]

    @admin.action(description="Mark selected providers as VERIFIED")
    def mark_verified(self, request, queryset):
        from django.utils import timezone
        for profile in queryset:
            profile.verification_status = FundiProfile.VerificationStatus.VERIFIED
            profile.verified_at = timezone.now()
            profile.save()
            profile.recalculate_trust_score()

    @admin.action(description="Mark selected providers as REJECTED")
    def mark_rejected(self, request, queryset):
        queryset.update(verification_status=FundiProfile.VerificationStatus.REJECTED)
