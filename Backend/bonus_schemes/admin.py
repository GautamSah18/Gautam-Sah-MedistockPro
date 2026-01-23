from django.contrib import admin
from .models import Bonus, Gift, BillScheme, AppliedBonus, AppliedScheme


@admin.register(Bonus)
class BonusAdmin(admin.ModelAdmin):
    list_display = ['name', 'medicine', 'buy_quantity', 'free_quantity', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active', 'start_date', 'end_date']
    search_fields = ['name', 'medicine__name']
    date_hierarchy = 'start_date'


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = ['name', 'value', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']


@admin.register(BillScheme)
class BillSchemeAdmin(admin.ModelAdmin):
    list_display = ['name', 'min_bill_amount', 'gift_value_limit', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active', 'start_date', 'end_date']
    search_fields = ['name', 'description']
    filter_horizontal = ['gifts']  # Better UI for ManyToMany fields
    date_hierarchy = 'start_date'


@admin.register(AppliedBonus)
class AppliedBonusAdmin(admin.ModelAdmin):
    list_display = ['bill', 'bonus', 'quantity_applied', 'created_at']
    list_filter = ['created_at']
    search_fields = ['bill__invoice_number', 'bonus__name']


@admin.register(AppliedScheme)
class AppliedSchemeAdmin(admin.ModelAdmin):
    list_display = ['bill', 'scheme', 'total_gift_value', 'created_at']
    list_filter = ['created_at']
    search_fields = ['bill__invoice_number', 'scheme__name']
    filter_horizontal = ['selected_gifts']
