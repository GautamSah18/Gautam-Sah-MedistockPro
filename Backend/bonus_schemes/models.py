from django.db import models
from django.core.validators import MinValueValidator
from inventory.models import Medicine
from Authentication.models import CustomUser



class Bonus(models.Model):
    name = models.CharField(max_length=255)
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name='bonuses'
    )
    buy_quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    free_quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medicine.name} Buy {self.buy_quantity} Get {self.free_quantity}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Bonus"
        verbose_name_plural = "Bonuses"



class Gift(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Rs {self.value})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Gift"
        verbose_name_plural = "Gifts"


class BillScheme(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    min_bill_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    total_gift_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    remaining_gift_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    gifts = models.ManyToManyField(Gift, blank=True, related_name="schemes")

    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Initializing remaining_gift_value only for new records
        if self.pk is None:
            self.remaining_gift_value = self.total_gift_value
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (Remaining Rs {self.remaining_gift_value})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Bill Scheme"
        verbose_name_plural = "Bill Schemes"


class AppliedScheme(models.Model):
    customer = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='applied_schemes'
    )
    scheme = models.ForeignKey(
        BillScheme,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    selected_gifts = models.ManyToManyField(Gift, blank=True, related_name="applied_schemes")

    total_gift_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.email} → {self.scheme.name} (Rs {self.total_gift_value})"

    class Meta:
        ordering = ['-applied_at']
        verbose_name = "Applied Scheme"
        verbose_name_plural = "Applied Schemes"
