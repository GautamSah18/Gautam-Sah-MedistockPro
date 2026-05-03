from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from .models import ExpiryReturnRequest
from notifications.services import notify_admins

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ExpiryReturnRequest)
def expiry_request_created(sender, instance, created, **kwargs):
    if created:
        customer = instance.customer
        identifier = (
            getattr(customer, 'username', None)
            or getattr(customer, 'email', None)
            or f"User #{customer.pk}"
        )

        try:
            notify_admins(
                f"New expiry return request from {identifier}",
                notification_type="expiry"
            )
        except Exception as e:
            logger.error(f"Failed to notify admins for expiry return {instance.pk}: {e}")