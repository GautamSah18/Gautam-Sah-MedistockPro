from django.db import models
from Authentication.models import CustomUser


class Bill(models.Model):
    PAYMENT_CHOICES = [
        ('cash', 'Cash'),
        ('credit', 'Credit'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('due', 'Due'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bills')
    items = models.JSONField()  # Store items as JSON
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_CHOICES)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Bill {self.invoice_number} - {self.customer.email}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Bill'
        verbose_name_plural = 'Bills'