import uuid

from django.conf import settings
from django.db import models


class ServiceCategory(models.Model):
    """
    Proposal 1.5 (Scope): Plumbing, Electrical, Carpentry, Masonry,
    Painting, Cleaning, General home repairs.
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    requires_regulatory_credential = models.BooleanField(
        default=False,
        help_text="True for categories where NCA/EPRA verification is expected (e.g. Electrical, Masonry).",
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier for the frontend.")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "service_categories"
        verbose_name_plural = "service categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class FundiProfile(models.Model):
    """
    Proposal 3.5: created automatically via signal (apps.users.signals)
    when a User registers with role=PROVIDER. Holds credentials, coverage
    area, availability, and the derived trust_score used for ranking
    search results (proposal 4.2.1).
    """

    class VerificationStatus(models.TextChoices):
        UNSUBMITTED = "unsubmitted", "Not Submitted"
        PENDING = "pending", "Pending Review"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    class CredentialBody(models.TextChoices):
        NCA = "nca", "National Construction Authority"
        EPRA = "epra", "Energy and Petroleum Regulatory Authority"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fundi_profile")

    bio = models.TextField(blank=True)
    categories = models.ManyToManyField(ServiceCategory, related_name="providers", blank=True)
    coverage_areas = models.JSONField(
        default=list, blank=True,
        help_text="List of Nairobi neighbourhoods served, e.g. ['Parklands', 'Westlands'].",
    )
    years_of_experience = models.PositiveSmallIntegerField(default=0)
    is_available = models.BooleanField(default=True)

    # Credential verification (REQ P-01, P-02; proposal 2.5)
    credential_body = models.CharField(max_length=10, choices=CredentialBody.choices, blank=True)
    credential_number = models.CharField(max_length=50, blank=True)
    verification_status = models.CharField(
        max_length=15, choices=VerificationStatus.choices, default=VerificationStatus.UNSUBMITTED,
    )
    verification_notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    # Trust score (Definition of Terms): composite of credential status +
    # aggregated review scores. Recalculated on review create (see reviews app).
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    completed_jobs_count = models.PositiveIntegerField(default=0)
    trust_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "fundi_profiles"
        indexes = [
            models.Index(fields=["verification_status"]),
            models.Index(fields=["is_available"]),
        ]

    def __str__(self):
        return f"FundiProfile<{self.user.get_full_name()}>"

    @property
    def is_verified(self):
        return self.verification_status == self.VerificationStatus.VERIFIED

    def recalculate_trust_score(self):
        """
        Trust Score = weighted combination of verification status and
        review rating (Definition of Terms, and Ch.4 'trust score
        recalculated' on review submission).
        Verification contributes up to 40 points; rating (0-5) is scaled
        to 60 points. Kept simple and transparent, deliberately not a
        black box, so providers understand what raises their ranking.
        """
        credential_component = 40 if self.is_verified else 0
        rating_component = float(self.average_rating) / 5 * 60 if self.average_rating else 0
        self.trust_score = round(credential_component + rating_component, 2)
        self.save(update_fields=["trust_score"])


class PortfolioImage(models.Model):
    """REQ P-04: providers can upload portfolio images and descriptions."""

    provider = models.ForeignKey(FundiProfile, on_delete=models.CASCADE, related_name="portfolio_images")
    image = models.ImageField(upload_to="portfolio/%Y/%m/")
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "portfolio_images"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Portfolio image for {self.provider.user.get_full_name()}"
