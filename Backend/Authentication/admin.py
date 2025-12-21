from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, PharmacyDocument
from django.utils.translation import gettext_lazy as _


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email','role', 'is_staff', 'is_active', 'is_approved', 'registration_complete')
    list_filter = ('role','is_staff', 'is_active', 'is_approved', 'registration_complete')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {
            'fields': ('role','is_active', 'is_staff', 'is_superuser', 'is_approved', 'registration_complete', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'is_staff', 'is_active')}
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        
        if obj is None:  # Creating a new user
            # Directly define the choices without accessing model
            registration_choices = [
                ('customer', 'Customer'),
                ('delivery', 'Delivery Person'),
            ]
            form.base_fields['role'].choices = registration_choices
        
        return form
    
    search_fields = ('email',)
    ordering = ('email',)


@admin.register(PharmacyDocument)
class PharmacyDocumentAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'uploaded_at', 'reviewed_at')
    list_filter = ('status', 'uploaded_at')
    search_fields = ('user__email', 'admin_notes')
    readonly_fields = ('uploaded_at', 'reviewed_at')


admin.site.register(CustomUser, CustomUserAdmin)