from rest_framework import serializers

from apps.providers.models import FundiProfile
from apps.verification.models import VerificationCheck


class CredentialSubmitSerializer(serializers.Serializer):
    credential_body = serializers.ChoiceField(choices=FundiProfile.CredentialBody.choices)
    credential_number = serializers.CharField(max_length=50)


class VerificationCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationCheck
        fields = [
            "id", "credential_body", "credential_number", "is_match",
            "status", "source", "raw_response", "checked_at", "reviewed_by_admin",
        ]
        read_only_fields = fields
