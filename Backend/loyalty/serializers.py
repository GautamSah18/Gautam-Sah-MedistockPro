from rest_framework import serializers
from .models import LoyaltyAccount, LoyaltyTransaction, CreditBill

class LoyaltyAccountSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    class Meta:
        model = LoyaltyAccount
        fields = ['id', 'user', 'total_points', 'tier', 'tier_display', 'created_at', 'updated_at']


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    class Meta:
        model = LoyaltyTransaction
        fields = ['id', 'user', 'points', 'reason', 'reason_display', 'created_at']


class CreditBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditBill
        fields = ['id', 'user', 'total_amount', 'purchase_date', 'due_date', 'payment_date', 'status']

class PayCreditBillSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
