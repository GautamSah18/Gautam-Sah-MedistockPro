from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ExpiryReturnRequest
from notifications.services import notify_admins


@receiver(post_save, sender=ExpiryReturnRequest)
def expiry_request_created(sender, instance, created, **kwargs):
    if created:
        notify_admins(
            f"New expiry return request from {instance.customer.username}",
            notification_type="expiry"
        )
