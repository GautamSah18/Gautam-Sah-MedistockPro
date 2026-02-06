from rest_framework import serializers
from .models import Bill


class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class BillCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def validate(self, attrs):
        if 'payment_status' not in attrs:
            payment_type = attrs.get('payment_type', '')
            if payment_type == 'cash':
                attrs['payment_status'] = 'paid'
            else:
                attrs['payment_status'] = 'pending'
        return attrs