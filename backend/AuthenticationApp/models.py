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
    def create_user(self, email, username=None, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)  # Add username
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
    username = models.CharField(
        _('username'),
        max_length=150,
        unique=True,
        blank=True,
        null=True,
        help_text=_('150 characters or fewer. Letters, digits and @/./+/-/_ only.'),
        validators=[RegexValidator(
            regex=r'^[\w.@+-]+\Z',
            message='Enter a valid username.'
        )],
        error_messages={'unique': _("This username is already taken.")},
    )
    # Basic Information
    email = models.EmailField(
        _('email address'),
        unique=True,
        error_messages={
            'unique': _("A user with that email already exists."),
        }
    )
    
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Security and account status fields (added)
    is_email_verified = models.BooleanField(default=False)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Define email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Remove 'username' from required fields
    
    # Set the custom manager
    objects = CustomUserManager()
    
    # Improved timezone field with proper choices
    timezone = models.CharField(
        _('timezone'),
        max_length=50,
        default=settings.TIME_ZONE,
        # Generate choices from pytz or zoneinfo
        choices=[(tz, tz) for tz in sorted(getattr(settings, 'TIMEZONE_CHOICES', [settings.TIME_ZONE]))]
    )
    
    def _reset_failed_attempts_if_needed(self, now):
        """Reset failed attempts count if last attempt was more than 24 hours ago."""
        if self.last_failed_login and (now - self.last_failed_login).total_seconds() > 24 * 3600:
            self.failed_login_attempts = 0
            self.save(update_fields=['failed_login_attempts'])

    def _handle_failed_login_attempt(self, now):
        """Handle a failed login attempt."""
        self.failed_login_attempts += 1
        self._update_failed_login_attempt(now)

    # Improved login attempt tracking with rate limiting
def record_login_attempt(self, success: bool, ip_address: str = None):
    """
    Record a login attempt and handle account locking with progressive timeouts.
    
    Args:
        success (bool): Whether the login attempt was successful
        ip_address (str, optional): The IP address of the login attempt
    """
    now = timezone.now()
    
    if success:
        # Reset counter and record successful login
        self.failed_login_attempts = 0
        self.last_login = now
        if ip_address:
            self.last_login_ip = ip_address
        self.save(update_fields=['failed_login_attempts', 'last_login', 'last_login_ip'])
    else:
        # Handle failed login
        self._reset_failed_attempts_if_needed(now)
        self.failed_login_attempts += 1
        self.last_failed_login = now
        
        # Progressive lockout periods based on number of failed attempts
        if self.failed_login_attempts >= 10:
            lockout_minutes = 24 * 60  # 24 hours
        elif self.failed_login_attempts >= 5:
            lockout_minutes = 30
        elif self.failed_login_attempts >= 3:
            lockout_minutes = 15
        else:
            lockout_minutes = 0
            
        if lockout_minutes > 0:
            self.account_locked_until = now + timezone.timedelta(minutes=lockout_minutes)
        
        if ip_address:
            self.last_login_ip = ip_address
            
        self.save(update_fields=['failed_login_attempts', 'last_failed_login', 
                               'account_locked_until', 'last_login_ip'])
    
    def _update_failed_login_attempt(self, now):
        """Update failed login attempt details."""
        self.last_failed_login = now
        
        # Progressive lockout periods based on number of failed attempts
        if self.failed_login_attempts >= 10:
            lockout_minutes = 24 * 60  # 24 hours
        elif self.failed_login_attempts >= 5:
            lockout_minutes = 30
        elif self.failed_login_attempts >= 3:
            lockout_minutes = 15
        else:
            lockout_minutes = 0
            
        if lockout_minutes > 0:
            self.account_locked_until = now + timezone.timedelta(minutes=lockout_minutes)
        
            self._update_failed_login_attempt(now)
            if lockout_minutes > 0:
                self.account_locked_until = now + timezone.timedelta(minutes=lockout_minutes)
            
            self.save(update_fields=['failed_login_attempts', 'last_failed_login', 'account_locked_until'])

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