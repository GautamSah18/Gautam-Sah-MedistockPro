from django.db import models
from Authentication.models import CustomUser
from datetime import timedelta
from django.utils import timezone

class LoyaltyAccount(models.Model):
    TIER_CHOICES = [
        ('regular', 'Regular'),
        ('bronze', 'Bronze Retailer'),
        ('silver', 'Silver Retailer'),
        ('gold', 'Gold Retailer'),
        ('diamond', 'Diamond Retailer'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='loyalty_account')
    total_points = models.IntegerField(default=0)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='regular')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_tier(self):
        if self.total_points >= 10000:
            return 'diamond'
        elif self.total_points >= 5000:
            return 'gold'
        elif self.total_points >= 2000:
            return 'silver'
        elif self.total_points >= 500:
            return 'bronze'
        else:
            return 'regular'

    def update_tier(self):
        new_tier = self.calculate_tier()
        if self.tier != new_tier:
            self.tier = new_tier
        self.save()

    def __str__(self):
        return f"{self.user.email} - {self.get_tier_display()} ({self.total_points} pts)"


class LoyaltyTransaction(models.Model):
    REASON_CHOICES = [
        ('purchase', 'Purchase'),
        ('early_credit_payment', 'Early Credit Payment'),
        ('late_payment_penalty', 'Late Payment Penalty'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='loyalty_transactions')
    points = models.IntegerField()  # CAN BE POSITIVE OR NEGATIVE
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.points} ({self.reason})"


def default_due_date():
    return timezone.now() + timedelta(days=60)

class CreditBill(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='credit_bills')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    purchase_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(default=default_due_date)
    payment_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')

    def __str__(self):
        return f"CreditBill - {self.user.email} - {self.total_amount} ({self.status})"
