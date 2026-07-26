from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.providers.views import (
    FundiProfileViewSet,
    ServiceCategoryListView,
    MyFundiProfileView,
    PortfolioImageUploadView,
    PortfolioImageDeleteView,
)

router = DefaultRouter()
router.register("", FundiProfileViewSet, basename="fundi-profile")

urlpatterns = [
    path("categories/", ServiceCategoryListView.as_view(), name="service-categories"),
    path("me/", MyFundiProfileView.as_view(), name="my-fundi-profile"),
    path("me/portfolio/", PortfolioImageUploadView.as_view(), name="my-portfolio"),
    path("me/portfolio/<int:pk>/", PortfolioImageDeleteView.as_view(), name="my-portfolio-delete"),
] + router.urls
