from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'AuthenticationApp.users'
    
    def ready(self):
        import AuthenticationApp.users.signals