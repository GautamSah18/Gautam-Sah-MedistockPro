from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


def notify_customers(message, notification_type="general"):
    customers = User.objects.filter(is_staff=False)

    Notification.objects.bulk_create([
        Notification(user=user, message=message, notification_type=notification_type)
        for user in customers
    ])

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        "customers",
        {
            "type": "send_notification",
            "message": message,
            "notification_type": notification_type,
        }
    )


def notify_admins(message, notification_type="general"):
    admins = User.objects.filter(is_staff=True)

    Notification.objects.bulk_create([
        Notification(user=user, message=message, notification_type=notification_type)
        for user in admins
    ])

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        "admins",
        {
            "type": "send_notification",
            "message": message,
            "notification_type": notification_type,
        }
    )
