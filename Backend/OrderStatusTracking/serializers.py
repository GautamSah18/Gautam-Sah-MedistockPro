from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    delivery_email = serializers.CharField(source="delivery_person.email", read_only=True)

    class Meta:
        model = Order
        fields = "__all__"