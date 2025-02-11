from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from AuthenticationApp.users.serializers import UserSerializer, UserUpdateSerializer
import jwt
from datetime import datetime, timedelta

User = get_user_model()

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.check_password(request.data.get('current_password')):
            raise ValidationError({'current_password': 'Wrong password.'})
        
        if request.data.get('new_password') != request.data.get('confirm_password'):
            raise ValidationError({'new_password': 'Passwords do not match.'})
            
        request.user.set_password(request.data.get('new_password'))
        request.user.save()
        return Response({'message': 'Password updated successfully.'})

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.check_password(request.data.get('password')):
            raise ValidationError({'password': 'Wrong password.'})
            
        request.user.delete()
        return Response({'message': 'Account deleted successfully.'})

class EmailVerificationView(APIView):
    def get(self, request, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(id=payload['user_id'])
            if not user.is_active:
                user.is_active = True
                user.save()
                return Response({'message': 'Email verified successfully.'})
            return Response({'message': 'Email already verified.'})
        except jwt.ExpiredSignatureError:
            raise ValidationError({'token': 'Verification link has expired.'})
        except (jwt.DecodeError, User.DoesNotExist):
            raise ValidationError({'token': 'Invalid verification link.'})

class ResendVerificationEmailView(APIView):
    def post(self, request):
        try:
            user = User.objects.get(email=request.data.get('email'))
            if user.is_active:
                return Response({'message': 'Email already verified.'})
                
            token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=1)
            }, settings.SECRET_KEY, algorithm='HS256')
            
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            send_mail(
                'Verify your email',
                f'Click the link to verify your email: {verification_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return Response({'message': 'Verification email sent.'})
        except User.DoesNotExist:
            raise ValidationError({'email': 'User with this email does not exist.'})

class UserActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'last_login': user.last_login,
            'date_joined': user.date_joined,
            'last_password_change': user.password_changed_at if hasattr(user, 'password_changed_at') else None,
        })

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'email_notifications': user.email_notifications if hasattr(user, 'email_notifications') else True,
            'timezone': user.timezone if hasattr(user, 'timezone') else settings.TIME_ZONE,
            'language': user.language if hasattr(user, 'language') else settings.LANGUAGE_CODE,
        })

    def patch(self, request):
        user = request.user
        if 'email_notifications' in request.data:
            user.email_notifications = request.data['email_notifications']
        if 'timezone' in request.data:
            user.timezone = request.data['timezone']
        if 'language' in request.data:
            user.language = request.data['language']
        user.save()
        return Response({'message': 'Settings updated successfully.'})