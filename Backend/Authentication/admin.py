from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, PharmacyDocument
from django.utils.translation import gettext_lazy as _


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'is_staff', 'is_active', 'is_approved', 'registration_complete')
    list_filter = ('is_staff', 'is_active', 'is_approved', 'registration_complete')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_approved', 'registration_complete', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email',)
    ordering = ('email',)


@admin.register(PharmacyDocument)
class PharmacyDocumentAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'uploaded_at', 'reviewed_at')
    list_filter = ('status', 'uploaded_at')
    search_fields = ('user__email', 'admin_notes')
    readonly_fields = ('uploaded_at', 'reviewed_at')


admin.site.register(CustomUser, CustomUserAdmin)