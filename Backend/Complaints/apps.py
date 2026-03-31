from django.apps import AppConfig


class ComplaintsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "Complaints"

    def ready(self):
        # Register signals
        try:
            import Complaints.signals
        except ImportError:
            pass
