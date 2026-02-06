from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import Bill


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = (
        'invoice_number',
        'customer',
        'payment_type',
        'total_amount',
        'created_at'
    )
    list_filter = (
        'payment_type',
        'created_at',
        'customer'
    )
    search_fields = (
        'invoice_number',
        'customer__email',
        'customer__first_name',
        'customer__last_name'
    )
    readonly_fields = ('created_at', 'updated_at')
    
    # Making fields read-only after creation to prevent accidental changes
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('invoice_number', 'customer', 'items', 'subtotal', 'discount', 'tax_total', 'total_amount', 'payment_type')
        return self.readonly_fields
    
    # Customize how the items are displayed
    def display_items(self, obj):
        if obj.items:
            # Return a formatted string of items
            items_list = []
            for item in obj.items:
                items_list.append(f"{item['name']} x{item['qty']}")
            return ", ".join(items_list)
        return "No items"
    
    # Add print button column
    def print_button(self, obj):
        return format_html(
            '<a href="/api/billing/admin/{}/print/" target="_blank" class="button default">Print Bill</a>',
            obj.pk
        )
    
    print_button.short_description = 'Print'
    
    display_items.short_description = 'Items'
    

    def get_list_display(self, request):
        list_display = super().get_list_display(request)
        return list_display + ('print_button',)