from rest_framework.permissions import BasePermission

class IsEmailVerified(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_active and 
                   getattr(request.user, 'email_verified_at', None))