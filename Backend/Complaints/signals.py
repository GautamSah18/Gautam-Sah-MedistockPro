from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Complaint
from notifications.services import notify_admins


@receiver(post_save, sender=Complaint)
def complaint_created(sender, instance, created, **kwargs):
    if created:
        notify_admins(
            f"New complaint submitted by {instance.customer.username}",
            notification_type="complaint"
        )
