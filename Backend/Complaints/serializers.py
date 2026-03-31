from rest_framework import serializers
from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True)

    class Meta:
        model = Complaint
        fields = "__all__"
        read_only_fields = ["customer", "status", "created_at"]
