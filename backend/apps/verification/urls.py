from django.urls import path

from apps.verification.views import SubmitCredentialView, MyVerificationHistoryView

urlpatterns = [
    path("submit/", SubmitCredentialView.as_view(), name="verification-submit"),
    path("history/", MyVerificationHistoryView.as_view(), name="verification-history"),
]
