from django.contrib import admin
from .models import Medicine, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'batch_no', 'stock', 'status', 'expiry_date', 'is_active')
    list_filter = ('status', 'category_type', 'is_active')
    search_fields = ('name', 'company', 'batch_no')
    readonly_fields = ('status', 'created_at', 'updated_at')

    fieldsets = (
        ('Basic', {'fields': ('name', 'generic_name', 'company', 'category_type', 'category')}),
        ('Batch', {'fields': ('batch_no', 'manufacture_date', 'expiry_date')}),
        ('Stock', {'fields': ('stock', 'min_stock', 'max_stock', 'unit', 'status')}),
        ('Pricing', {'fields': ('cost_price', 'selling_price', 'mrp')}),
        ('Extra', {'fields': ('description', 'storage_conditions', 'image')}),
        ('Status', {'fields': ('is_active',)}),
        ('Audit', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
