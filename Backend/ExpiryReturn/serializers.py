from rest_framework import serializers
from .models import ExpiryReturnRequest


class ExpiryReturnSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)

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
        read_only_fields = ["customer", "status", "created_at"]
