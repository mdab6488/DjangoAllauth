from django.urls import path
from .views import (
    UserProfileView, 
    UpdateProfileView,
    ChangePasswordView,
    DeleteAccountView,
    EmailVerificationView,
    ResendVerificationEmailView,
    UserActivityView,
    UserSettingsView
)

app_name = 'api'

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('profile/password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/delete/', DeleteAccountView.as_view(), name='delete-account'),
    path('profile/activity/', UserActivityView.as_view(), name='user-activity'),
    path('profile/settings/', UserSettingsView.as_view(), name='user-settings'),
    path('email/verify/<str:token>/', EmailVerificationView.as_view(), name='verify-email'),
    path('email/resend/', ResendVerificationEmailView.as_view(), name='resend-verification'),
]