from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, OTP, PharmacyDocument



# Custom User Admin

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser

    # Columns shown in user list
    list_display = (
        "email",
        "role",
        "is_active",
        "is_staff",
        "is_approved",
        "registration_complete",
    )

    # Filters in sidebar
    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_approved",
        "registration_complete",
    )

    ordering = ("email",)
    search_fields = ("email",)

    # User detail layout
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "profile_picture")}),
        (_("Permissions"), {
            "fields": (
                "role",
                "is_active",
                "is_staff",
                "is_superuser",
                "is_approved",
                "registration_complete",
                "groups",
                "user_permissions",
            )
        }),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    # User creation form
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "password1",
                "password2",
                "role",
                "is_active",
                "is_staff",
            ),
        }),
    )

    # Restrict role selection when creating users
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj is None and "role" in form.base_fields:
            form.base_fields["role"].choices = (
                ("customer", "Customer"),
                ("delivery", "Delivery Person"),
            )
        return form



# Pharmacy Document Admin

@admin.register(PharmacyDocument)
class PharmacyDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "status",
        "uploaded_at",
        "reviewed_at",
    )

    list_filter = (
        "status",
        "uploaded_at",
    )

    search_fields = (
        "user__email",
        "admin_notes",
    )

    readonly_fields = (
        "uploaded_at",
        "reviewed_at",
    )

    actions = ["approve_documents", "reject_documents"]

    # Approve selected documents
    def approve_documents(self, request, queryset):
        for document in queryset:
            document.status = "approved"
            document.reviewed_at = document.reviewed_at or document.uploaded_at
            document.save()

            user = document.user
            user.is_approved = True
            user.save()

        self.message_user(request, "Selected documents approved.")

    approve_documents.short_description = "Approve selected documents"

    # Reject selected documents
    def reject_documents(self, request, queryset):
        queryset.update(status="rejected")
        self.message_user(request, "Selected documents rejected.")

    reject_documents.short_description = "Reject selected documents"



# OTP Admin

@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "code",
        "is_verified",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "is_verified",
        "created_at",
        "expires_at",
    )

    search_fields = (
        "user__email",
        "code",
    )

    readonly_fields = (
        "created_at",
        "expires_at",
    )

    ordering = ("-created_at",)
