from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import redirect, get_object_or_404
from django.utils.html import format_html

from .models import ExpiryReturnRequest
from .views import send_expiry_status_email


@admin.register(ExpiryReturnRequest)
class ExpiryReturnAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "customer",
        "medicine",
        "quantity",
        "expiry_date",
        "status",
        "approve_button",
        "reject_button",
    )

    list_filter = ("status",)
    search_fields = ("medicine", "customer__email")

    # Approve Button
    def approve_button(self, obj):
        if obj.status == "Pending":
            return format_html(
                '<a class="button" href="approve/{}/">Approve</a>',
                obj.id
            )
        return "-"
    approve_button.short_description = "Approve"

    # Reject Button
    def reject_button(self, obj):
        if obj.status == "Pending":
            return format_html(
                '<a class="button" href="reject/{}/">Reject</a>',
                obj.id
            )
        return "-"
    reject_button.short_description = "Reject"

    # Custom URLs
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("approve/<int:pk>/", self.admin_site.admin_view(self.approve_request)),
            path("reject/<int:pk>/", self.admin_site.admin_view(self.reject_request)),
        ]
        return custom_urls + urls

    # Approve Logic
    def approve_request(self, request, pk):
        obj = get_object_or_404(ExpiryReturnRequest, pk=pk)
        obj.status = "Approved"
        obj.save()

        try:
            send_expiry_status_email(obj)
            messages.success(request, "Expiry return approved and email sent successfully.")
        except Exception as e:
            messages.warning(
                request,
                f"Expiry return approved, but email could not be sent: {str(e)}"
            )

        return redirect(request.META.get('HTTP_REFERER', '/admin/'))

    # Reject Logic
    def reject_request(self, request, pk):
        obj = get_object_or_404(ExpiryReturnRequest, pk=pk)
        obj.status = "Rejected"
        obj.save()

        try:
            send_expiry_status_email(obj)
            messages.success(request, "Expiry return rejected and email sent successfully.")
        except Exception as e:
            messages.warning(
                request,
                f"Expiry return rejected, but email could not be sent: {str(e)}"
            )

        return redirect(request.META.get('HTTP_REFERER', '/admin/'))