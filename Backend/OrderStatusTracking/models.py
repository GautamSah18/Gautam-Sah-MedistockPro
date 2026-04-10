from django.db import models
from django.conf import settings


class Order(models.Model):

    STATUS_CHOICES = [
        ("received", "Order Received"),
        ("packing", "Packing"),
        ("ready_for_dispatch", "Ready for Dispatch"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
    ]

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_orders"
    )

    delivery_person = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="delivery_orders"
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="received"
    )

    is_accepted = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} - {self.status}"