from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.users.models import User


@receiver(post_save, sender=User)
def create_fundi_profile_for_providers(sender, instance, created, **kwargs):
    """
    Proposal 3.5 (Database Design): "When a user registers as a provider,
    a FundiProfile is automatically created using a Django signal."
    """
    if not created or instance.role != User.Role.PROVIDER:
        return

    from apps.providers.models import FundiProfile

    FundiProfile.objects.get_or_create(user=instance)
