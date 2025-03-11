from rest_framework.permissions import BasePermission
from django.utils import timezone

class IsEmailVerified(BasePermission):
    """
    Permission that checks if the user's email is verified.
    """
    message = "Email verification required. Please verify your email address."
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_active and 
            request.user.is_email_verified and
            getattr(request.user, 'email_verified_at', None) is not None
        )

class IsNotLocked(BasePermission):
    """
    Permission that checks if the user account is not locked.
    """
    message = "Your account is temporarily locked due to multiple failed login attempts."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return True  # Let authentication classes handle unauthenticated users
            
        if not hasattr(request.user, 'account_locked_until'):
            return True
            
        return not (request.user.account_locked_until and request.user.account_locked_until > timezone.now())