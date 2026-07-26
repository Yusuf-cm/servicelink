from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import ServiceRequest, Booking, Message
from apps.bookings.serializers import (
    ServiceRequestCreateSerializer,
    ServiceRequestSerializer,
    ServiceRequestDecisionSerializer,
    BookingSerializer,
    BookingStatusUpdateSerializer,
    MessageSerializer,
)
from apps.users.permissions import IsClient, IsProvider


class IsRequestParty(permissions.BasePermission):
    """Only the client who made the request or the targeted provider may view/act on it."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if hasattr(obj, "client") and hasattr(obj, "provider"):
            return obj.client == user or obj.provider.user == user
        return False


class ServiceRequestViewSet(viewsets.ModelViewSet):
    """
    REQ C-04 (create), C-07 (track status). Clients see requests they
    made; providers see requests sent to them.
    """

    permission_classes = [permissions.IsAuthenticated, IsRequestParty]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if user.is_provider:
            return ServiceRequest.objects.filter(provider__user=user).select_related(
                "client", "provider__user", "category"
            )
        return ServiceRequest.objects.filter(client=user).select_related("client", "provider__user", "category")

    def get_serializer_class(self):
        if self.action == "create":
            return ServiceRequestCreateSerializer
        return ServiceRequestSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsClient()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(ServiceRequestSerializer(instance).data, status=status.HTTP_201_CREATED)


class ServiceRequestDecisionView(APIView):
    """REQ: provider accepts or declines a request (proposal 4.2.3)."""

    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def post(self, request, pk):
        service_request = get_object_or_404(ServiceRequest, pk=pk, provider__user=request.user)

        if service_request.status != ServiceRequest.Status.PENDING:
            return Response(
                {"detail": f"This request has already been {service_request.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ServiceRequestDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data["decision"] == "decline":
            service_request.status = ServiceRequest.Status.DECLINED
            service_request.save(update_fields=["status", "updated_at"])
            return Response(ServiceRequestSerializer(service_request).data)

        service_request.status = ServiceRequest.Status.ACCEPTED
        service_request.save(update_fields=["status", "updated_at"])

        booking = Booking.objects.create(
            service_request=service_request,
            client=service_request.client,
            provider=service_request.provider,
            agreed_price_kes=data["agreed_price_kes"],
            scheduled_date=data["scheduled_date"],
        )

        return Response(
            {
                "service_request": ServiceRequestSerializer(service_request).data,
                "booking": BookingSerializer(booking).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MessageListCreateView(generics.ListCreateAPIView):
    """REQ C-05: messaging between client and provider on a service request."""

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_service_request(self):
        sr = get_object_or_404(ServiceRequest, pk=self.kwargs["request_id"])
        user = self.request.user
        if sr.client != user and sr.provider.user != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not a party to this service request.")
        return sr

    def get_queryset(self):
        return Message.objects.filter(service_request=self.get_service_request())

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user, service_request=self.get_service_request())


class BookingViewSet(viewsets.ReadOnlyModelViewSet):
    """REQ C-07: clients and providers track booking status."""

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related("client", "provider__user", "service_request")
        if user.is_provider:
            return qs.filter(provider__user=user)
        return qs.filter(client=user)


class BookingStatusUpdateView(APIView):
    """
    Provider moves a paid booking through in_progress -> completed.
    Completing a booking increments the provider's completed_jobs_count,
    which factors into their trust score and search ranking.
    """

    permission_classes = [permissions.IsAuthenticated, IsProvider]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, provider__user=request.user)

        if booking.payment_status != Booking.PaymentStatus.PAID:
            return Response(
                {"detail": "Booking must be paid before work can be marked in progress or completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BookingStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        if new_status == Booking.Status.IN_PROGRESS and booking.status != Booking.Status.CONFIRMED:
            return Response({"detail": "Only a confirmed booking can move to in_progress."}, status=400)
        if new_status == Booking.Status.COMPLETED and booking.status not in (
            Booking.Status.CONFIRMED, Booking.Status.IN_PROGRESS,
        ):
            return Response({"detail": "Booking is not in a state that can be completed."}, status=400)

        booking.status = new_status
        if new_status == Booking.Status.COMPLETED:
            booking.completed_at = timezone.now()
            booking.provider.completed_jobs_count += 1
            booking.provider.save(update_fields=["completed_jobs_count"])
            booking.provider.recalculate_trust_score()
        booking.save()

        return Response(BookingSerializer(booking).data)
