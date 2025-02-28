from datetime import datetime, timedelta
from typing import Dict, Any, Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser
from django.core.mail import send_mail
from django.utils import timezone
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import jwt

from .serializers import UserSerializer, UserUpdateSerializer
from .permissions import IsEmailVerified
from .throttling import EmailVerificationRateThrottle, LoginRateThrottle

from django.db import connections
from django.db.utils import OperationalError
import logging
import os
import time

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    def create_verification_token(self, user: AbstractBaseUser) -> str:
        """Create a JWT token for email verification."""
        return jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.now(timezone.utc) + timedelta(days=1),
                'type': 'email_verification'
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
    
    def send_verification_email(self, user: AbstractBaseUser, token: str) -> None:
        """Send verification email to user."""
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_mail(
            subject='Verify your email',
            message=f'Click the link to verify your email: {verification_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
            html_message=f"""
                <h2>Welcome to {settings.SITE_NAME}!</h2>
                <p>Please verify your email by clicking the link below:</p>
                <a href="{verification_url}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            """
        )

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set user as inactive until email verification
        user = serializer.save(is_active=False)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        token = self.create_verification_token(user)
        
        try:
            self.send_verification_email(user, token)
        except Exception as e:
            user.delete()
            raise ValidationError({
                'email': 'Failed to send verification email. Please try again.'
            }) from e

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Registration successful. Please verify your email.'
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]
    
    def validate_login_data(self, data: Dict[str, Any]) -> Tuple[str, str]:
        """Validate login credentials."""
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email:
            raise ValidationError({'email': 'Email is required.'})
        if not password:
            raise ValidationError({'password': 'Password is required.'})
            
        return email, password
    
    def get_and_validate_user(self, email: str, password: str) -> AbstractBaseUser:
        """Get and validate user account status."""
        try:
            user = User.objects.get(email=email)

            # Check if account is deleted
            if hasattr(user, 'deleted_at') and user.deleted_at is not None:
                raise ValidationError({
                    'error': 'This account has been deleted. Please contact support for restoration.'
                })

            # Check account status
            if not user.is_active:
                if hasattr(user, 'email_verified_at') and not user.email_verified_at:
                    raise ValidationError({
                        'error': 'Please verify your email before logging in.'
                    })
                raise ValidationError({
                    'error': 'Account is not active. Please contact support.'
                })

            # Validate password
            if not user.check_password(password):
                if hasattr(user, 'failed_login_attempts'):
                    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                    user.save(update_fields=['failed_login_attempts'])
                raise ValidationError({'error': 'Invalid credentials.'})

            # Reset failed login attempts on successful login
            if hasattr(user, 'failed_login_attempts') and user.failed_login_attempts:
                user.failed_login_attempts = 0
                user.save(update_fields=['failed_login_attempts'])

            return user

        except User.DoesNotExist as e:
            raise ValidationError({'error': 'Invalid credentials.'}) from e
    
    def create_verification_token(self, user: AbstractBaseUser) -> str:
        return jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.now(timezone.utc) + timedelta(days=1),
                'type': 'email_verification'
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
    
    def send_verification_email(self, user: AbstractBaseUser, token: str) -> None:
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_mail(
            subject='Verify your email',
            message=f'Click the link to verify your email: {verification_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
            html_message=f"""
                <h2>Email Verification Required</h2>
                <p>Please verify your email by clicking the link below:</p>
                <a href="{verification_url}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            """
        )
    
    def generate_tokens(self, user: AbstractBaseUser) -> Dict[str, str]:
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
    
    def update_user_login_info(self, user: AbstractBaseUser, request: Request) -> None:
        """Update user's login-related information."""
        user.last_login = timezone.now()
        
        # Update optional tracking fields if they exist
        update_fields = ['last_login']
        
        if hasattr(user, 'last_active_at'):
            user.last_active_at = timezone.now()
            update_fields.append('last_active_at')
            
        if hasattr(user, 'last_login_ip'):
            user.last_login_ip = request.META.get('REMOTE_ADDR')
            update_fields.append('last_login_ip')
            
        if hasattr(user, 'last_login_user_agent'):
            user.last_login_user_agent = request.META.get('HTTP_USER_AGENT')
            update_fields.append('last_login_user_agent')
            
        if hasattr(user, 'login_count'):
            user.login_count = user.login_count + 1 if user.login_count else 1
            update_fields.append('login_count')
            
        user.save(update_fields=update_fields)
    
    def generate_auth_token(self, user: AbstractBaseUser) -> Dict[str, str]:
        """Generate authentication token for user."""
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return {'token': token.key}
    
    def post(self, request: Request) -> Response:
        """Handle login request."""
        try:
            # Validate input data
            email, password = self.validate_login_data(request.data)
            
            # Validate user and account status
            user = self.get_and_validate_user(email, password)
            
            # Generate authentication token
            auth_data = self.generate_auth_token(user)
            
            # Update user login information
            self.update_user_login_info(user, request)
            
            return Response({
                **auth_data,
                'message': 'Login successful.'
            }, status=status.HTTP_200_OK)
            
        except ValidationError:
            raise
        except Exception:
            return Response(
                {'error': 'An unexpected error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def get(self, request: Request) -> Response:
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def patch(self, request: Request) -> Response:
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def validate_password_change(self, user: AbstractBaseUser, data: Dict[str, str]) -> None:
        """Validate password change data."""
        if not user.check_password(data.get('current_password', '')):
            raise ValidationError({'current_password': 'Wrong password.'})
        
        if data.get('new_password') != data.get('confirm_password'):
            raise ValidationError({'new_password': 'Passwords do not match.'})
        
        if data.get('new_password') == data.get('current_password'):
            raise ValidationError({
                'new_password': 'New password must be different from current password.'
            })

    def post(self, request: Request) -> Response:
        self.validate_password_change(request.user, request.data)
        
        request.user.set_password(request.data['new_password'])
        request.user.password_changed_at = timezone.now()
        request.user.save()
        
        # Invalidate all existing tokens
        RefreshToken.for_user(request.user)
        
        return Response({
            'message': 'Password updated successfully. Please login again.'
        })

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def post(self, request: Request) -> Response:
        if not request.user.check_password(request.data.get('password', '')):
            raise ValidationError({'password': 'Wrong password.'})
        
        user = request.user
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save()
        
        return Response({
            'message': 'Account deactivated successfully. Contact support to restore.'
        })

class EmailVerificationView(APIView):
    throttle_classes = [EmailVerificationRateThrottle]

    def verify_token(self, token: str) -> AbstractBaseUser:
        """Verify JWT token and return user."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            
            if payload.get('type') != 'email_verification':
                raise ValidationError({'token': 'Invalid token type.'})
                
            return User.objects.get(id=payload['user_id'])
            
        except jwt.ExpiredSignatureError as e:
            raise ValidationError({'token': 'Verification link has expired.'}) from e
        except (jwt.DecodeError, User.DoesNotExist) as e:
            raise ValidationError({'token': 'Invalid verification link.'}) from e

    def get(self, request: Request, token: str) -> Response:
        user = self.verify_token(token)
        
        if user.is_active:
            return Response({'message': 'Email already verified.'})
            
        user.is_active = True
        user.email_verified_at = timezone.now()
        user.save()
        
        return Response({'message': 'Email verified successfully.'})

class ResendVerificationEmailView(APIView):
    throttle_classes = [EmailVerificationRateThrottle]

    def post(self, request: Request) -> Response:
        try:
            user = User.objects.get(email=request.data.get('email', ''))
            
            if user.is_active:
                return Response({'message': 'Email already verified.'})

            token = jwt.encode(
                {
                    'user_id': user.id,
                    'exp': datetime.now(timezone.utc) + timedelta(days=1),
                    'type': 'email_verification'
                },
                settings.SECRET_KEY,
                algorithm='HS256'
            )

            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            send_mail(
                'Verify your email',
                f'Click the link to verify your email: {verification_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
                html_message=f"""
                    <h2>Email Verification</h2>
                    <p>Please verify your email by clicking the link below:</p>
                    <a href="{verification_url}">Verify Email</a>
                    <p>This link will expire in 24 hours.</p>
                """
            )
            return Response({'message': 'Verification email sent.'})
            
        except User.DoesNotExist as e:
            raise ValidationError({
                'email': 'User with this email does not exist.'
            }) from e

class UserActivityView(APIView):
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def get(self, request: Request) -> Response:
        user = request.user
        return Response({
            'last_login': user.last_login,
            'date_joined': user.date_joined,
            'password_changed_at': getattr(user, 'password_changed_at', None),
            'email_verified_at': getattr(user, 'email_verified_at', None),
            'last_active_at': getattr(user, 'last_active_at', None)
        })

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def get(self, request: Request) -> Response:
        user = request.user
        return Response({
            'email_notifications': getattr(user, 'email_notifications', True),
            'timezone': getattr(user, 'timezone', settings.TIME_ZONE),
            'language': getattr(user, 'language', settings.LANGUAGE_CODE),
            'two_factor_enabled': getattr(user, 'two_factor_enabled', False)
        })

    def patch(self, request: Request) -> Response:
        user = request.user
        valid_fields = {
            'email_notifications': bool,
            'timezone': str,
            'language': str,
            'two_factor_enabled': bool
        }

        for field, field_type in valid_fields.items():
            if field in request.data:
                try:
                    value = field_type(request.data[field])
                    setattr(user, field, value)
                except (ValueError, TypeError) as e:
                    raise ValidationError({
                        field: f'Invalid value. Expected {field_type.__name__}.'
                    }) from e

        user.save()
        return Response({'message': 'Settings updated successfully.'})



logger = logging.getLogger(__name__)

def healthcheck(request):
    """
    Health check endpoint to verify the application is running correctly.
    Checks:
    1. Database connection
    2. Response time
    3. Basic environment configuration
    """
    start_time = time.time()
    health_status = {
        "status": "ok",
        "timestamp": start_time,
        "checks": {
            "database": check_database(),
            "environment": check_environment(),
        }
    }
    
    # Calculate response time
    response_time = time.time() - start_time
    health_status["response_time"] = round(response_time * 1000, 2)  # Convert to ms
    
    # Set overall status
    if any(check.get("status") != "ok" for check in health_status["checks"].values()):
        health_status["status"] = "unhealthy"
        status_code = 503  # Service Unavailable
    else:
        status_code = 200
    
    return JsonResponse(health_status, status=status_code)

def check_database():
    """Check if database connection is working"""
    try:
        # Verify database connection is alive
        db_conn = connections["default"]
        db_conn.cursor()
        return {
            "status": "ok",
            "message": "Database connection established"
        }
    except OperationalError as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }

def check_environment():
    """Check critical environment variables"""
    required_vars = [
        "DJANGO_SETTINGS_MODULE",
        "DATABASE_URL",
        "DJANGO_SECRET_KEY"
    ]
    
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        return {
            "status": "warning",
            "message": f"Missing environment variables: {', '.join(missing_vars)}"
        }
    return {
        "status": "ok",
        "message": "All required environment variables present"
    }