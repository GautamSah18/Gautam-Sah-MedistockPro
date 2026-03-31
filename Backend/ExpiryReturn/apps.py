from django.apps import AppConfig


class ExpiryreturnConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ExpiryReturn"

    def ready(self):
        # Import signals so they get registered
        try:
            import ExpiryReturn.signals
        except ImportError:
            pass
