from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import User


class IsClient(BasePermission):
    """Restricts an action to authenticated users with role=client."""

    message = "Only clients can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.CLIENT)


class IsProvider(BasePermission):
    """Restricts an action to authenticated users with role=provider."""

    message = "Only service providers can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.PROVIDER)


class IsAdminRole(BasePermission):
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission: read for anyone with list/detail access, but
    only the owning client/provider (`obj.owner_field`) may write.
    Views using this must define `owner_field` (defaults to 'user').
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner_field = getattr(view, "owner_field", "user")
        owner = obj
        for part in owner_field.split("."):
            owner = getattr(owner, part, None)
        return owner == request.user
