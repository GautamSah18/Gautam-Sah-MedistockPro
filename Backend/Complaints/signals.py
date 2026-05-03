from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from .models import Complaint
from notifications.services import notify_admins

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Complaint)
def complaint_created(sender, instance, created, **kwargs):
    if created:
        customer = instance.customer
        identifier = (
            getattr(customer, 'username', None)
            or getattr(customer, 'email', None)
            or f"User #{customer.pk}"
        )

        try:
            notify_admins(
                f"New complaint submitted by {identifier}",
                notification_type="complaint"
            )
        except Exception as e:
            logger.error(f"Failed to notify admins for complaint {instance.pk}: {e}")