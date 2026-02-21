from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bonus, BillScheme
from notifications.services import notify_customers


@receiver(post_save, sender=Bonus)
def bonus_created(sender, instance, created, **kwargs):
    if created:
        notify_customers(
            f"New bonus added: Buy {instance.buy_quantity} Get {instance.free_quantity} on {instance.medicine.name}",
            notification_type="bonus"
        )

@receiver(post_save, sender=BillScheme)
def bill_scheme_created(sender, instance, created, **kwargs):
    if created:
        notify_customers(
            f"New scheme added: {instance.name}",
            notification_type="scheme"
        )
