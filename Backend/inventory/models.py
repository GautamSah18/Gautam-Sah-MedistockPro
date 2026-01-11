from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from cloudinary.models import CloudinaryField


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']


class Medicine(models.Model):
    CATEGORY_CHOICES = [
        ('Tablet', 'Tablet'),
        ('Capsule', 'Capsule'),
        ('Syrup', 'Syrup'),
        ('Injection', 'Injection'),
        ('Ointment', 'Ointment'),
        ('Drops', 'Drops'),
        ('Inhaler', 'Inhaler'),
        ('Other', 'Other'),
    ]

    UNIT_CHOICES = [
        ('strip', 'Strip'),
        ('bottle', 'Bottle'),
        ('box', 'Box'),
        ('tube', 'Tube'),
        ('vial', 'Vial'),
        ('pack', 'Pack'),
    ]

    STATUS_CHOICES = [
        ('In Stock', 'In Stock'),
        ('Low Stock', 'Low Stock'),
        ('Out of Stock', 'Out of Stock'),
        ('Expired', 'Expired'),
    ]

    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    company = models.CharField(max_length=255)

    category_type = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='Tablet'
    )
    category = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="General category name"
    )

    batch_no = models.CharField(max_length=100, unique=True)
    manufacture_date = models.DateField()
    expiry_date = models.DateField()

    stock = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=0
    )
    min_stock = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=10
    )
    max_stock = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=1000
    )
    unit = models.CharField(
        max_length=20,
        choices=UNIT_CHOICES,
        default='strip'
    )

    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    mrp = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='In Stock'
    )
    is_active = models.BooleanField(default=True)

    description = models.TextField(blank=True, null=True)
    storage_conditions = models.CharField(max_length=255, blank=True, null=True)

    image = CloudinaryField(
        'medicine_image',
        blank=True,
        null=True
    )

    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        today = timezone.now().date()

        if self.expiry_date <= today:
            self.status = 'Expired'
        elif self.stock <= 0:
            self.status = 'Out of Stock'
        elif self.stock <= self.min_stock:
            self.status = 'Low Stock'
        else:
            self.status = 'In Stock'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.company}"

    class Meta:
        verbose_name = "Medicine"
        verbose_name_plural = "Medicines"
        ordering = ['-created_at']
