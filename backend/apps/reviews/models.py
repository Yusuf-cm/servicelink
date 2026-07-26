from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from apps.bookings.models import Booking
from apps.providers.models import FundiProfile


class Review(models.Model):
    """
    REQ C-06. Proposal 3.5: "the system only allows one review per
    booking. This prevents manipulation of ratings and maintains the
    integrity of the trust system." Enforced via OneToOneField, backed by
    a unique DB constraint (proposal 4.4, TC-10).

    Proposal 2.3 (Literature Review — Mayzlin et al.): only clients who
    have completed and paid for a service may leave a review, enforced
    by only allowing a review to attach to a COMPLETED booking.
    """

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="review")
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_written")
    provider = models.ForeignKey(FundiProfile, on_delete=models.CASCADE, related_name="reviews_received")

    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["provider"])]

    def __str__(self):
        return f"{self.rating}\u2605 review for {self.provider.user.get_full_name()} by {self.client.get_full_name()}"
