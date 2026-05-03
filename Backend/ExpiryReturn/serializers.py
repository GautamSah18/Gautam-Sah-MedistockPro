from rest_framework import serializers
from .models import ExpiryReturnRequest


class ExpiryReturnSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = ExpiryReturnRequest
        fields = [
            "id",
            "customer",
            "customer_name",
            "medicine",
            "batch",
            "expiry_date",
            "quantity",
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