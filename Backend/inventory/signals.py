from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Medicine
from notifications.services import notify_customers


@receiver(post_save, sender=Medicine)
def medicine_created(sender, instance, created, **kwargs):
    if created:
        notify_customers(
            f"New medicine added: {instance.name}",
            notification_type="medicine"
        )
