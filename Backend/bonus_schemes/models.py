from django.db import models
from django.core.validators import MinValueValidator
from inventory.models import Medicine
from Billing.models import Bill


class Bonus(models.Model):
    """Model for item-level bonuses (e.g., Buy 10 get 2 free)"""
    name = models.CharField(max_length=255, help_text="Name of the bonus scheme")
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name='bonuses',
        help_text="Medicine this bonus applies to"
    )
    buy_quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Number of items to buy to qualify for bonus"
    )
    free_quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Number of free items given"
    )
    start_date = models.DateField(help_text="When the bonus becomes active")
    end_date = models.DateField(help_text="When the bonus expires")
    is_active = models.BooleanField(default=True, help_text="Whether the bonus is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.medicine.name}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Bonus'
        verbose_name_plural = 'Bonuses'


class Gift(models.Model):
    """Model for gifts that can be awarded in schemes"""
    name = models.CharField(max_length=255, help_text="Name of the gift")
    description = models.TextField(blank=True, null=True, help_text="Description of the gift")
    value = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Monetary value of the gift"
    )
    image_url = models.URLField(blank=True, null=True, help_text="Image URL for the gift")
    is_active = models.BooleanField(default=True, help_text="Whether the gift is available")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} (Rs {self.value})"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Gift'
        verbose_name_plural = 'Gifts'


class BillScheme(models.Model):
    """Model for bill-level schemes (e.g., spend Rs 1,00,000 get Rs 10,000 worth of gifts)"""
    name = models.CharField(max_length=255, help_text="Name of the scheme")
    description = models.TextField(blank=True, null=True, help_text="Description of the scheme")
    min_bill_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Minimum bill amount required to qualify"
    )
    gift_value_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Maximum value of gifts that can be selected"
    )
    gifts = models.ManyToManyField(
        Gift,
        related_name='schemes',
        blank=True,
        help_text="Available gifts for this scheme"
    )
    start_date = models.DateField(help_text="When the scheme becomes active")
    end_date = models.DateField(help_text="When the scheme expires")
    is_active = models.BooleanField(default=True, help_text="Whether the scheme is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} (Min: Rs {self.min_bill_amount})"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Bill Scheme'
        verbose_name_plural = 'Bill Schemes'


class AppliedBonus(models.Model):
    """Tracks bonuses applied to bills"""
    bill = models.ForeignKey(
        Bill,
        on_delete=models.CASCADE,
        related_name='applied_bonuses'
    )
    bonus = models.ForeignKey(
        Bonus,
        on_delete=models.CASCADE,
        related_name='applied_to_bills'
    )
    quantity_applied = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="How many times this bonus was applied"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Bonus {self.bonus.name} applied to {self.bill.invoice_number}"
    
    class Meta:
        unique_together = ['bill', 'bonus']
        verbose_name = 'Applied Bonus'
        verbose_name_plural = 'Applied Bonuses'


class AppliedScheme(models.Model):
    """Tracks schemes applied to bills"""
    bill = models.ForeignKey(
        Bill,
        on_delete=models.CASCADE,
        related_name='applied_schemes'
    )
    scheme = models.ForeignKey(
        BillScheme,
        on_delete=models.CASCADE,
        related_name='applied_to_bills'
    )
    selected_gifts = models.ManyToManyField(
        Gift,
        related_name='selected_in_applied_schemes',
        blank=True,
        help_text="Gifts selected by customer"
    )
    total_gift_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Total value of selected gifts"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Scheme {self.scheme.name} applied to {self.bill.invoice_number}"
    
    class Meta:
        unique_together = ['bill', 'scheme']
        verbose_name = 'Applied Scheme'
        verbose_name_plural = 'Applied Schemes'
