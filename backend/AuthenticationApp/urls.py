from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/update/', views.UpdateProfileView.as_view(), name='update-profile'),
    path('profile/delete/', views.DeleteAccountView.as_view(), name='delete-account'),
    path('profile/activity/', views.UserActivityView.as_view(), name='user-activity'),
    path('profile/settings/', views.UserSettingsView.as_view(), name='user-settings'),
    
    # Password management
    path('password/change/', views.ChangePasswordView.as_view(), name='password-change'),
    
    # Email verification
    path('email/verify/<str:token>/', views.EmailVerificationView.as_view(), name='verify-email'),
    path('email/resend/', views.ResendVerificationEmailView.as_view(), name='resend-verification'),
    
]