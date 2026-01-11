from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access inventory.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_staff or getattr(request.user, 'role', None) == 'admin'

