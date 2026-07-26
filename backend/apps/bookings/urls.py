from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.bookings.views import (
    ServiceRequestViewSet,
    ServiceRequestDecisionView,
    MessageListCreateView,
    BookingViewSet,
    BookingStatusUpdateView,
)

router = DefaultRouter()
router.register("requests", ServiceRequestViewSet, basename="service-request")
router.register("", BookingViewSet, basename="booking")

urlpatterns = [
    path("requests/<uuid:pk>/decision/", ServiceRequestDecisionView.as_view(), name="service-request-decision"),
    path("requests/<uuid:request_id>/messages/", MessageListCreateView.as_view(), name="service-request-messages"),
    path("<uuid:pk>/status/", BookingStatusUpdateView.as_view(), name="booking-status-update"),
] + router.urls
