from django.urls import path

from apps.payments.views import (
    InitiateSTKPushView,
    MpesaCallbackView,
    TransactionStatusView,
    BookingTransactionsView,
)

urlpatterns = [
    path("mpesa/initiate/", InitiateSTKPushView.as_view(), name="mpesa-initiate"),
    path("mpesa/callback/", MpesaCallbackView.as_view(), name="mpesa-callback"),
    path("mpesa/status/<str:checkout_request_id>/", TransactionStatusView.as_view(), name="mpesa-status"),
    path("booking/<uuid:booking_id>/transactions/", BookingTransactionsView.as_view(), name="booking-transactions"),
]
