from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import redirect, get_object_or_404
from django.utils.html import format_html
from .models import Complaint
from .views import send_complaint_email


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "customer",
        "medicine_name",
        "status",
        "approve_button",
        "reject_button",
    )

    def approve_button(self, obj):
        if obj.status == "Pending":
            return format_html(
                '<a class="button" href="approve/{}/">Approve</a>',
                obj.id
            )
        return "-"
    approve_button.short_description = "Approve"

    def reject_button(self, obj):
        if obj.status == "Pending":
            return format_html(
                '<a class="button" href="reject/{}/">Reject</a>',
                obj.id
            )
        return "-"
    reject_button.short_description = "Reject"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("approve/<int:pk>/", self.admin_site.admin_view(self.approve)),
            path("reject/<int:pk>/", self.admin_site.admin_view(self.reject)),
        ]
        return custom_urls + urls

    def approve(self, request, pk):
        obj = get_object_or_404(Complaint, pk=pk)
        obj.status = "Approved"
        obj.save()

        try:
            send_complaint_email(obj)
            messages.success(request, "Complaint approved and email sent successfully.")
        except Exception as e:
            messages.warning(
                request,
                f"Complaint approved, but email could not be sent: {str(e)}"
            )

        return redirect(request.META.get('HTTP_REFERER', '/admin/'))

    def reject(self, request, pk):
        obj = get_object_or_404(Complaint, pk=pk)
        obj.status = "Rejected"
        obj.save()

        try:
            send_complaint_email(obj)
            messages.success(request, "Complaint rejected and email sent successfully.")
        except Exception as e:
            messages.warning(
                request,
                f"Complaint rejected, but email could not be sent: {str(e)}"
            )

        return redirect(request.META.get('HTTP_REFERER', '/admin/'))