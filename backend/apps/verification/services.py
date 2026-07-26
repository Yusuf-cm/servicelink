"""
Credential verification backend for NCA (National Construction Authority)
and EPRA (Energy and Petroleum Regulatory Authority) registration numbers.

Proposal 1.5 (Scope) and 4.1 (Implementation Approach): "Credential
verification will initially be conducted manually by an administrator
through submitted registration details, with plans for automated
integration with regulatory bodies in future versions."

Neither body currently exposes a public verification API, so this module
provides a MOCK backend that simulates what a real lookup would return.
It exists to let the rest of the system (admin workflow, trust score,
badges, tests) be built and demoed against a realistic response shape
today. Swapping in a real integration later is a matter of implementing
`LiveVerificationBackend.check()` and flipping VERIFICATION_BACKEND in
settings — no other code needs to change.
"""

import hashlib
import time
from dataclasses import dataclass, asdict
from django.conf import settings


@dataclass
class VerificationResult:
    is_match: bool
    status: str  # 'active', 'expired', 'not_found'
    holder_name_on_record: str
    credential_body: str
    credential_number: str
    source: str
    raw: dict


class BaseVerificationBackend:
    def check(self, credential_body: str, credential_number: str, claimed_name: str) -> VerificationResult:
        raise NotImplementedError


class MockVerificationBackend(BaseVerificationBackend):
    """
    Deterministic mock: the outcome is derived from a hash of the
    credential number, so the same input always produces the same result
    (useful for demos and automated tests) without needing a live
    registry. A short artificial delay simulates a network round-trip.
    """

    TEST_NUMBERS = {
        # Reserved numbers for demoing each path predictably.
        "NCA/TEST/VALID": ("active", True),
        "NCA/TEST/EXPIRED": ("expired", False),
        "NCA/TEST/NOTFOUND": ("not_found", False),
    }

    def check(self, credential_body: str, credential_number: str, claimed_name: str) -> VerificationResult:
        time.sleep(0.3)  # simulate external API latency

        number = credential_number.strip().upper()

        if number in self.TEST_NUMBERS:
            status, is_match = self.TEST_NUMBERS[number]
        else:
            digest = hashlib.sha256(number.encode()).hexdigest()
            bucket = int(digest[:2], 16) % 10
            if bucket < 7:
                status, is_match = "active", True
            elif bucket < 9:
                status, is_match = "expired", False
            else:
                status, is_match = "not_found", False

        return VerificationResult(
            is_match=is_match,
            status=status,
            holder_name_on_record=claimed_name if is_match else "",
            credential_body=credential_body,
            credential_number=credential_number,
            source=f"mock-{credential_body}-registry",
            raw={
                "mock": True,
                "note": "Simulated response — no live NCA/EPRA API is integrated in this phase.",
                "status": status,
            },
        )


class LiveVerificationBackend(BaseVerificationBackend):
    """
    Placeholder for the real NCA/EPRA integration described in Chapter 5.4
    (Future Developments). Once formal API access is granted, implement
    the actual HTTP calls here.
    """

    def check(self, credential_body: str, credential_number: str, claimed_name: str) -> VerificationResult:
        raise NotImplementedError(
            "Live NCA/EPRA verification is not yet available. "
            "Set VERIFICATION_BACKEND=mock in settings until real API access is arranged."
        )


def get_backend() -> BaseVerificationBackend:
    if settings.VERIFICATION_BACKEND == "live":
        return LiveVerificationBackend()
    return MockVerificationBackend()


def result_to_dict(result: VerificationResult) -> dict:
    return asdict(result)
