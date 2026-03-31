from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import FileExtensionValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta
import random
import string

from .managers import CustomUserManager



# Custom User Model

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('customer', 'Customer'),
        ('delivery', 'Delivery Person'),
    )

    username = None
    email = models.EmailField(_('email address'), unique=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_approved = models.BooleanField(
        default=False,
        help_text="Indicates if the user is approved by admin."
    )
    registration_complete = models.BooleanField(
        default=False,
        help_text="Indicates if user has uploaded all required documents."
    )

    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Avoid reverse accessor clashes
    groups = models.ManyToManyField(
        Group,
        related_name="customuser_set",
        blank=True,
        verbose_name=_('groups'),
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="customuser_permissions_set",
        blank=True,
        verbose_name=_('user permissions'),
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    class Meta:
        verbose_name = _('Pharmacy User')
        verbose_name_plural = _('Pharmacy Users')

    def __str__(self):
        return self.email

    def can_login(self):
        if self.role == 'admin':
            return self.is_active
        return self.is_active and self.is_approved and self.registration_complete

# Pharmacy Documents
class PharmacyDocument(models.Model):
    DOCUMENT_STATUS = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='documents'
    )

    pharmacy_license = models.FileField(
        upload_to='documents/pharmacy_license/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])],
    )
    pan_number = models.FileField(
        upload_to='documents/pan/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])],
    )
    citizenship = models.FileField(
        upload_to='documents/citizenship/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])],
    )

    status = models.CharField(
        max_length=10,
        choices=DOCUMENT_STATUS,
        default='pending'
    )

    admin_notes = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Pharmacy Document"
        verbose_name_plural = "Pharmacy Documents"

    def __str__(self):
        return f"Documents for {self.user.email}"



# OTP Model
class OTP(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='otps'
    )

    code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_attempt_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "OTP"
        verbose_name_plural = "OTPs"
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.user.email}"

    @classmethod
    def generate_otp(cls, user):
        
        #Generates a fresh OTP for a user. Deletes any previous unverified OTPs.

        cls.objects.filter(user=user, is_verified=False).delete()

        otp_code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timedelta(minutes=10)

        return cls.objects.create(
            user=user,
            code=otp_code,
            expires_at=expires_at
        )

    def is_expired(self):
        return timezone.now() > self.expires_at
