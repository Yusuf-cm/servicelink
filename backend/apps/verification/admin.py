from django.contrib import admin

from apps.verification.models import VerificationCheck


@admin.register(VerificationCheck)
class VerificationCheckAdmin(admin.ModelAdmin):
    """
    Gives the admin (proposal 4.1's manual reviewer) the mock/live
    registry result alongside the provider's claim, so the decision to
    verify/reject in FundiProfileAdmin is an informed one.
    """

    list_display = ["provider", "credential_body", "credential_number", "status", "is_match", "checked_at", "reviewed_by_admin"]
    list_filter = ["credential_body", "status", "is_match", "reviewed_by_admin"]
    search_fields = ["provider__user__email", "credential_number"]
    readonly_fields = ["provider", "credential_body", "credential_number", "is_match", "status", "source", "raw_response", "checked_at"]
    actions = ["mark_reviewed"]

    @admin.action(description="Mark selected checks as reviewed")
    def mark_reviewed(self, request, queryset):
        queryset.update(reviewed_by_admin=True)
