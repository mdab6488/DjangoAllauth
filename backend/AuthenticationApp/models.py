from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    """Custom user model manager with email as the unique identifier."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    """Custom User model with enhanced fields and functionality."""

    # Basic Information
    username = None  # Disable username field
    email = models.EmailField(
        _('email address'),
        unique=True,
        error_messages={
            'unique': _("A user with that email already exists."),
        }
    )
    phone_number = models.CharField(
        _('phone number'),
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message=_("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
            )
        ],
        blank=True,
        null=True
    )
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    
    # Profile Information
    bio = models.TextField(_('biography'), max_length=500, blank=True)
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True
    )
    
    # Account Status and Security
    is_email_verified = models.BooleanField(_('email verified'), default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    two_factor_enabled = models.BooleanField(_('2FA enabled'), default=False)
    backup_codes = models.JSONField(null=True, blank=True)
    
    # Activity Tracking
    last_active_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Preferences
    email_notifications = models.BooleanField(_('email notifications'), default=True)
    push_notifications = models.BooleanField(_('push notifications'), default=True)
    timezone = models.CharField(
        max_length=50,
        default=settings.TIME_ZONE,
        choices=[(tz, tz) for tz in settings.TIMEZONE_CHOICES]
        if hasattr(settings, 'TIMEZONE_CHOICES') else None
    )
    language = models.CharField(
        max_length=10,
        default=settings.LANGUAGE_CODE,
        choices=settings.LANGUAGES
    )
    theme = models.CharField(
        max_length=20,
        choices=[
            ('light', _('Light')),
            ('dark', _('Dark')),
            ('system', _('System'))
        ],
        default='system'
    )

    # Django Configuration
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = CustomUserManager()

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the full name of the user."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def soft_delete(self):
        """Soft delete the user account."""
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save()

    def record_login_attempt(self, success: bool, ip_address: str = None):
        """Record a login attempt."""
        if success:
            self.failed_login_attempts = 0
            self.last_login_ip = ip_address
            self.last_login = timezone.now()
        else:
            self.failed_login_attempts += 1
            self.last_failed_login = timezone.now()
            
            # Lock account after 5 failed attempts
            if self.failed_login_attempts >= 5:
                self.account_locked_until = timezone.now() + timezone.timedelta(minutes=30)
        
        self.save()

    def is_account_locked(self) -> bool:
        """Check if the account is temporarily locked."""
        return bool(self.account_locked_until and self.account_locked_until > timezone.now())

    def generate_backup_codes(self):
        """Generate new 2FA backup codes."""
        import secrets
        import string

        # Generate 10 backup codes
        alphabet = string.ascii_letters + string.digits
        codes = [
            ''.join(secrets.choice(alphabet) for _ in range(8))
            for _ in range(10)
        ]
        self.backup_codes = codes
        self.save()
        return codes

    def update_activity(self):
        """Update the user's last activity timestamp."""
        self.last_active_at = timezone.now()
        self.save(update_fields=['last_active_at'])

    def has_verified_phone(self) -> bool:
        """Check if user has a verified phone number."""
        return bool(self.phone_number)

    @property
    def requires_password_change(self) -> bool:
        """Check if user needs to change their password."""
        if not self.password_changed_at:
            return True
        
        # Require password change every 90 days
        password_age = timezone.now() - self.password_changed_at
        return password_age.days >= 90

class UserSession(models.Model):
    """Model to track user sessions and devices."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    device_type = models.CharField(max_length=20)
    browser = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField()
    location = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.email} - {self.device_type} - {self.created_at}"