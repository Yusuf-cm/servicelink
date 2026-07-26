from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

api_v1_patterns = [
    path("auth/", include("apps.users.urls")),
    path("providers/", include("apps.providers.urls")),
    path("bookings/", include("apps.bookings.urls")),
    path("reviews/", include("apps.reviews.urls")),
    path("payments/", include("apps.payments.urls")),
    path("verification/", include("apps.verification.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_v1_patterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
