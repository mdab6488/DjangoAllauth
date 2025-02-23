from django.apps import AppConfig

class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'AuthenticationApp'
    verbose_name = 'Authentication'

    def ready(self):
        # Import signals
        from . import signals
        # Explicitly register signals if needed
        signals.send_verification_email  # noqa
        signals.update_password_changed_at  # noqa
        signals.create_user_settings  # noqa
        signals.send_welcome_email  # noqa