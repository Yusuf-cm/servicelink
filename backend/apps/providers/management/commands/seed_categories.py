from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.providers.models import ServiceCategory

CATEGORIES = [
    ("Plumbing", False, "wrench"),
    ("Electrical", True, "bolt"),
    ("Carpentry", False, "hammer"),
    ("Masonry", True, "brick"),
    ("Painting", False, "paint-roller"),
    ("Cleaning", False, "spray-bottle"),
    ("General Home Repairs", False, "tools"),
]


class Command(BaseCommand):
    help = "Seeds the service categories defined in the ServiceLink proposal scope (1.5)."

    def handle(self, *args, **options):
        created_count = 0
        for name, requires_credential, icon in CATEGORIES:
            _, created = ServiceCategory.objects.get_or_create(
                slug=slugify(name),
                defaults={
                    "name": name,
                    "requires_regulatory_credential": requires_credential,
                    "icon": icon,
                },
            )
            if created:
                created_count += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded categories ({created_count} created, {len(CATEGORIES)} total)."))
