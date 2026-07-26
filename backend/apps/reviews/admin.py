from django.contrib import admin

from apps.reviews.models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["provider", "client", "rating", "created_at"]
    list_filter = ["rating"]
    search_fields = ["provider__user__email", "client__email", "comment"]
    readonly_fields = ["booking", "client", "provider", "created_at"]
