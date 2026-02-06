from rest_framework import serializers
from .models import Bonus, Gift, BillScheme, AppliedScheme
from inventory.models import Medicine
from Authentication.models import CustomUser


class MedicineMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = ["id", "name", "company"]


class BonusSerializer(serializers.ModelSerializer):
    medicine = MedicineMiniSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(),
        source="medicine",
        write_only=True
    )

    class Meta:
        model = Bonus
        fields = "__all__"


class GiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gift
        fields = '__all__'


class BillSchemeSerializer(serializers.ModelSerializer):
    gifts = GiftSerializer(many=True, read_only=True)

    class Meta:
        model = BillScheme
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name']


class AppliedSchemeSerializer(serializers.ModelSerializer):
    selected_gifts = GiftSerializer(many=True, read_only=True)
    scheme = BillSchemeSerializer(read_only=True)
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = AppliedScheme
        fields = '__all__'
