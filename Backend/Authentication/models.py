from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import FileExtensionValidator
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager


class CustomUser(AbstractUser):

    Role_Choices = (
        ('admin', 'Admin'),
        ('customer', 'Customer'),
        ('delivery', 'Delivery Person')
    )

    username = None
    email = models.EmailField(_('email address'), unique=True)

    role = models.CharField(
        max_length= 20,
        choices= Role_Choices
    )
    is_approved = models.BooleanField(
        default=False,
        help_text="Indicates if the user is approved by admin."
    )
    registration_complete = models.BooleanField(
        default=False,
        help_text="Indicates if user has uploaded all required documents."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Override groups and user_permissions to avoid reverse accessor clashes
    groups = models.ManyToManyField(
        Group,
        related_name="customuser_set",
        blank=True,
        help_text=_('The groups this user belongs to.'),
        verbose_name=_('groups')
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="customuser_permissions_set",
        blank=True,
        help_text=_('Specific permissions for this user.'),
        verbose_name=_('user permissions')
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
        """
        Check if user can login.
        Admin users can login if they are active (no document verification needed).
        Other users need to be approved and have completed registration.
        """
        if self.role == 'admin':
            return self.is_active  # Admin only needs to be active
        return self.is_approved and self.registration_complete


class PharmacyDocument(models.Model):
    DOCUMENT_STATUS = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    pharmacy_license = models.FileField(
        upload_to='documents/pharmacy_license/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])],
        help_text="Upload pharmacy license document"
    )
    pan_number = models.FileField(
        upload_to='documents/pan/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])],
        help_text="Upload PAN card document"
    )
    citizenship = models.FileField(
        upload_to='documents/citizenship/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])],
        help_text="Upload citizenship document"
    )
    status = models.CharField(
        max_length=10,
        choices=DOCUMENT_STATUS,
        default='pending'
    )
    admin_notes = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Pharmacy Document"
        verbose_name_plural = "Pharmacy Documents"

    def __str__(self):
        return f"Documents for {self.user.email}"