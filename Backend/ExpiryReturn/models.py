from django.db import models
from django.conf import settings


class ExpiryReturnRequest(models.Model):

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,   # ✅ FIXED HERE
        on_delete=models.CASCADE,
        related_name="expiry_returns"
    )

    medicine = models.CharField(max_length=255)
    batch = models.CharField(max_length=100, blank=True, null=True)
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField()
    reason = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medicine} - {self.customer} ({self.status})"
