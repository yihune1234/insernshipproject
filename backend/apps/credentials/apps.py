from django.apps import AppConfig


class CredentialsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.credentials"
    label = "credentials"

    def ready(self):
        from apps.credentials.signals import connect_signals
        connect_signals()
