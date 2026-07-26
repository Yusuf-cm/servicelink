from django.urls import path

from apps.reviews.views import ProviderReviewListView, ReviewCreateView, MyReviewsView

urlpatterns = [
    path("", ReviewCreateView.as_view(), name="review-create"),
    path("mine/", MyReviewsView.as_view(), name="my-reviews"),
    path("provider/<uuid:provider_id>/", ProviderReviewListView.as_view(), name="provider-reviews"),
]
