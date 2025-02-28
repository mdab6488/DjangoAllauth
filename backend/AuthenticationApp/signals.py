import contextlib
from datetime import timezone
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from .models import User  # Use relative import

@receiver(post_save, sender=User)
def send_verification_email(sender, instance, created, **kwargs):
    if created and not instance.is_superuser:
        token = jwt.encode(
            {
                'user_id': instance.id,
                'exp': datetime.now(timezone.utc) + timedelta(days=1),
            },
            settings.SECRET_KEY,
            algorithm='HS256',
        )

        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        send_mail(
            'Verify your email',
            f'Welcome to our platform!\n\nPlease click the following link to verify your email: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [instance.email],
            fail_silently=False,
        )

@receiver(pre_save, sender=User)
def update_password_changed_at(sender, instance, **kwargs):
    if instance.pk:
        with contextlib.suppress(User.DoesNotExist):
            old_user = User.objects.get(pk=instance.pk)
            if old_user.password != instance.password:
                instance.password_changed_at = datetime.now()

@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    pass

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if created and instance.is_active:
        send_mail(
            'Welcome to Our Platform',
            f'Hi {instance.get_full_name()},\n\n'
            'Welcome to our platform! We\'re excited to have you here.\n\n'
            'Best regards,\nThe Team',
            settings.DEFAULT_FROM_EMAIL,
            [instance.email],
            fail_silently=False,
        )