from rest_framework import serializers
from .models import Bonus, Gift, BillScheme, AppliedBonus, AppliedScheme
from inventory.models import Medicine
from Billing.models import Bill


class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = ['id', 'name', 'company', 'selling_price', 'unit']


class GiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gift
        fields = ['id', 'name', 'description', 'value', 'image_url', 'is_active']


class BonusSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(),
        source='medicine',
        write_only=True
    )
    
    class Meta:
        model = Bonus
        fields = [
            'id', 'name', 'medicine', 'medicine_id', 'buy_quantity',
            'free_quantity', 'start_date', 'end_date', 'is_active',
            'created_at', 'updated_at'
        ]


class BillSchemeSerializer(serializers.ModelSerializer):
    gifts = GiftSerializer(many=True, read_only=True)
    gift_ids = serializers.PrimaryKeyRelatedField(
        queryset=Gift.objects.filter(is_active=True),
        many=True,
        write_only=True,
        source='gifts'
    )
    
    class Meta:
        model = BillScheme
        fields = [
            'id', 'name', 'description', 'min_bill_amount', 'gift_value_limit',
            'gifts', 'gift_ids', 'start_date', 'end_date', 'is_active',
            'created_at', 'updated_at'
        ]


class AppliedBonusSerializer(serializers.ModelSerializer):
    bonus = BonusSerializer(read_only=True)
    
    class Meta:
        model = AppliedBonus
        fields = ['id', 'bill', 'bonus', 'quantity_applied', 'created_at']
        read_only_fields = ['bill']


class AppliedSchemeSerializer(serializers.ModelSerializer):
    scheme = BillSchemeSerializer(read_only=True)
    selected_gifts = GiftSerializer(many=True, read_only=True)
    selected_gift_ids = serializers.PrimaryKeyRelatedField(
        queryset=Gift.objects.filter(is_active=True),
        many=True,
        write_only=True,
        source='selected_gifts'
    )
    
    class Meta:
        model = AppliedScheme
        fields = [
            'id', 'bill', 'scheme', 'selected_gifts', 'selected_gift_ids',
            'total_gift_value', 'created_at'
        ]
        read_only_fields = ['bill', 'total_gift_value']


class EligibleSchemesSerializer(serializers.Serializer):
    """Serializer for checking eligible schemes for a cart"""
    cart_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    eligible_schemes = BillSchemeSerializer(many=True, read_only=True)


class CartBonusCheckSerializer(serializers.Serializer):
    """Serializer for checking applicable bonuses for cart items"""
    medicine_id = serializers.IntegerField()
    quantity = serializers.IntegerField()
