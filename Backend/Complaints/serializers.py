from rest_framework import serializers
from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            "id",
            "customer",
            "customer_name",
            "medicine_name",
            "reason",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "customer", "customer_name", "status", "created_at"]

    def get_customer_name(self, obj):
        if obj.customer:
            full_name = f"{obj.customer.first_name or ''} {obj.customer.last_name or ''}".strip()
            return full_name if full_name else obj.customer.email
        return ""