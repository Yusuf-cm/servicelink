from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.providers.models import FundiProfile
from apps.users.permissions import IsProvider
from apps.verification.models import VerificationCheck
from apps.verification.serializers import CredentialSubmitSerializer, VerificationCheckSerializer
from apps.verification.services import get_backend, result_to_dict


class SubmitCredentialView(APIView):
    """
    REQ P-01: providers submit their NCA/EPRA registration number.
    Proposal 4.1: this does NOT auto-verify — it stores the submission,
    runs the (currently mocked) registry check for the admin's reference,
    and sets status to PENDING for manual review in the Django admin.
    """

    permission_classes = [IsProvider]

    def post(self, request):
        serializer = CredentialSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile = request.user.fundi_profile
        profile.credential_body = serializer.validated_data["credential_body"]
        profile.credential_number = serializer.validated_data["credential_number"]
        profile.verification_status = FundiProfile.VerificationStatus.PENDING
        profile.verified_at = None
        profile.save()

        backend = get_backend()
        result = backend.check(
            credential_body=profile.credential_body,
            credential_number=profile.credential_number,
            claimed_name=request.user.get_full_name(),
        )

        check = VerificationCheck.objects.create(
            provider=profile,
            credential_body=result.credential_body,
            credential_number=result.credential_number,
            is_match=result.is_match,
            status=result.status,
            source=result.source,
            raw_response=result_to_dict(result),
        )

        return Response(
            {
                "detail": "Credentials submitted. Your verification status is now pending admin review.",
                "verification_status": profile.verification_status,
                "preliminary_check": VerificationCheckSerializer(check).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MyVerificationHistoryView(generics.ListAPIView):
    """Lets a provider see the history of checks run against their credentials."""

    serializer_class = VerificationCheckSerializer
    permission_classes = [IsProvider]

    def get_queryset(self):
        return VerificationCheck.objects.filter(provider=self.request.user.fundi_profile)
