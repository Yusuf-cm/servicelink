from django.db import models

from apps.providers.models import FundiProfile


class VerificationCheck(models.Model):
    """
    Audit trail of every credential check run for a provider — created
    each time a provider submits/resubmits credentials, or an admin
    re-runs a check. Keeps a history independent of FundiProfile's
    current status, which only reflects the latest decision.
    """

    provider = models.ForeignKey(FundiProfile, on_delete=models.CASCADE, related_name="verification_checks")
    credential_body = models.CharField(max_length=10)
    credential_number = models.CharField(max_length=50)
    is_match = models.BooleanField()
    status = models.CharField(max_length=20)  # active / expired / not_found
    source = models.CharField(max_length=50)
    raw_response = models.JSONField(default=dict)
    checked_at = models.DateTimeField(auto_now_add=True)
    reviewed_by_admin = models.BooleanField(
        default=False, help_text="Set once an admin has looked at this check and made a final decision.",
    )

    class Meta:
        db_table = "verification_checks"
        ordering = ["-checked_at"]

    def __str__(self):
        return f"{self.credential_body.upper()} check for {self.provider.user.get_full_name()} ({self.status})"
