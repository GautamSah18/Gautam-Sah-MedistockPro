from rest_framework import serializers
from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = "__all__"
        read_only_fields = ["customer", "status", "created_at"]

    def get_customer_name(self, obj):
        if obj.customer:
            full_name = f"{obj.customer.first_name or ''} {obj.customer.last_name or ''}".strip()
            if full_name:
                return full_name
            return obj.customer.email
        return ""