from django.apps import AppConfig


class BonusSchemesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "bonus_schemes"

    def ready(self):
        # Register signals
        try:
            import bonus_schemes.signals
        except ImportError:
            pass
