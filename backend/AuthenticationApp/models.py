from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of usernames.
    """
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

    def active(self):
        """Return only active users."""
        return self.filter(is_active=True, deleted_at__isnull=True)

    def with_verified_email(self):
        """Return users with verified email addresses."""
        return self.filter(is_email_verified=True)

class User(AbstractUser):
    """
    Custom User model that uses email as the unique identifier and adds
    additional fields for enhanced user management and security.
    """
    # Remove username field as we use email
    username = None

    # Basic Information
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
    
    # Fixed timezone field - error was in the choices format
    timezone = models.CharField(
        max_length=50,
        default=settings.TIME_ZONE,
        choices=[(tz, tz) for tz in getattr(settings, 'TIMEZONE_CHOICES', [settings.TIME_ZONE])]
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
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['last_active_at']),
            models.Index(fields=['is_active', 'deleted_at']),
        ]

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the user's full name or email if name is not set."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def soft_delete(self):
        """Soft delete the user account instead of hard deletion."""
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_active', 'deleted_at'])

    def record_login_attempt(self, success: bool, ip_address: str = None):
        """
        Record a login attempt and handle account locking.
        
        Args:
            success (bool): Whether the login attempt was successful
            ip_address (str, optional): The IP address of the login attempt
        """
        if success:
            self.failed_login_attempts = 0
            self.last_login_ip = ip_address
            self.last_login = timezone.now()
            self.save(update_fields=['failed_login_attempts', 'last_login_ip', 'last_login'])
        else:
            self.failed_login_attempts += 1
            self.last_failed_login = timezone.now()
            
            # Lock account after 5 failed attempts
            if self.failed_login_attempts >= 5:
                self.account_locked_until = timezone.now() + timezone.timedelta(minutes=30)
            
            self.save(update_fields=['failed_login_attempts', 'last_failed_login', 'account_locked_until'])

    def is_account_locked(self) -> bool:
        """Check if the account is temporarily locked due to failed login attempts."""
        if not self.account_locked_until:
            return False
        return self.account_locked_until > timezone.now()

    def generate_backup_codes(self, count: int = 10, length: int = 8) -> list:
        """
        Generate new 2FA backup codes.
        
        Args:
            count (int): Number of backup codes to generate
            length (int): Length of each backup code
            
        Returns:
            list: List of generated backup codes
        """
        import secrets
        import string

        alphabet = string.ascii_letters + string.digits
        codes = [
            ''.join(secrets.choice(alphabet) for _ in range(length))
            for _ in range(count)
        ]
        self.backup_codes = codes
        self.save(update_fields=['backup_codes'])
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
        """Check if user needs to change their password based on age."""
        if not self.password_changed_at:
            return True
        
        password_age = timezone.now() - self.password_changed_at
        return password_age.days >= 90

class UserSessionManager(models.Manager):
    """Manager for UserSession model."""
    
    def active(self):
        """Return only active sessions."""
        return self.filter(is_active=True)
    
    def for_user(self, user):
        """Return all sessions for a specific user."""
        return self.filter(user=user)
    
    def inactive(self):
        """Return inactive sessions."""
        return self.filter(is_active=False)

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

    objects = UserSessionManager()

    class Meta:
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_key']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.device_type} - {self.created_at}"

    def end_session(self):
        """End this session."""
        self.is_active = False
        self.save(update_fields=['is_active'])