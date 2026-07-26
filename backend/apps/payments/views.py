from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.payments.mpesa import DarajaClient, DarajaError, normalize_phone_number
from apps.payments.models import MpesaTransaction
from apps.payments.serializers import InitiatePaymentSerializer, MpesaTransactionSerializer
from apps.users.permissions import IsClient


class InitiateSTKPushView(APIView):
    """
    REQ C-08. Client confirms a booking -> STK push is sent to their
    phone (proposal 4.2.3 / 4.1).
    """

    permission_classes = [permissions.IsAuthenticated, IsClient]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking = get_object_or_404(
            Booking, pk=serializer.validated_data["booking_id"], client=request.user,
        )
        if booking.payment_status == Booking.PaymentStatus.PAID:
            return Response({"detail": "This booking has already been paid for."}, status=status.HTTP_400_BAD_REQUEST)

        phone_number = normalize_phone_number(serializer.validated_data["phone_number"])

        try:
            client = DarajaClient()
            result = client.stk_push(
                phone_number=phone_number,
                amount=int(booking.agreed_price_kes),
                account_reference=str(booking.id)[:12],
                transaction_desc=f"ServiceLink #{str(booking.id)[:8]}",
            )
        except DarajaError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        txn = MpesaTransaction.objects.create(
            booking=booking,
            phone_number=phone_number,
            amount_kes=booking.agreed_price_kes,
            merchant_request_id=result.get("MerchantRequestID", ""),
            checkout_request_id=result["CheckoutRequestID"],
        )

        return Response(
            {
                "detail": "STK push sent. Ask the client to enter their M-Pesa PIN on their phone.",
                "transaction": MpesaTransactionSerializer(txn).data,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class MpesaCallbackView(APIView):
    """
    Public endpoint that Safaricom's Daraja API calls once the customer
    completes (or cancels) the STK push on their phone. See:
    https://developer.safaricom.co.ke/Documentation -> Lipa na M-Pesa
    Online Payment -> Callback.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "mpesa_callback"

    def post(self, request):
        body = request.data.get("Body", {}).get("stkCallback", {})
        checkout_request_id = body.get("CheckoutRequestID")

        if not checkout_request_id:
            return Response({"ResultCode": 1, "ResultDesc": "Missing CheckoutRequestID"}, status=200)

        try:
            txn = MpesaTransaction.objects.select_related("booking").get(checkout_request_id=checkout_request_id)
        except MpesaTransaction.DoesNotExist:
            return Response({"ResultCode": 1, "ResultDesc": "Unknown transaction"}, status=200)

        result_code = body.get("ResultCode")
        txn.result_code = result_code
        txn.result_desc = body.get("ResultDesc", "")
        txn.raw_callback = request.data

        if result_code == 0:
            metadata = {item["Name"]: item.get("Value") for item in body.get("CallbackMetadata", {}).get("Item", [])}
            txn.status = MpesaTransaction.Status.SUCCESS
            txn.mpesa_receipt_number = metadata.get("MpesaReceiptNumber", "")
            txn.save()

            booking = txn.booking
            booking.payment_status = Booking.PaymentStatus.PAID
            booking.status = Booking.Status.CONFIRMED
            booking.confirmed_at = timezone.now()
            booking.save(update_fields=["payment_status", "status", "confirmed_at"])
        else:
            txn.status = MpesaTransaction.Status.FAILED
            txn.save()

        # Daraja expects a 200 with this exact shape regardless of outcome.
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)


class TransactionStatusView(generics.RetrieveAPIView):
    """Lets the frontend poll for the outcome of an STK push while the user is on their phone."""

    serializer_class = MpesaTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "checkout_request_id"
    lookup_url_kwarg = "checkout_request_id"

    def get_queryset(self):
        return MpesaTransaction.objects.filter(booking__client=self.request.user)


class BookingTransactionsView(generics.ListAPIView):
    serializer_class = MpesaTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = MpesaTransaction.objects.filter(booking_id=self.kwargs["booking_id"])
        if user.is_provider:
            return qs.filter(booking__provider__user=user)
        return qs.filter(booking__client=user)
