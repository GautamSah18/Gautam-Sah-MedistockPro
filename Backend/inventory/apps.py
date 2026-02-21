from django.apps import AppConfig


class InventoryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "inventory"

    def ready(self):
        # Import signals to ensure they are registered
        try:
            import inventory.signals
        except ImportError:
            pass
