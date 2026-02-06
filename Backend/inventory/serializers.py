from rest_framework import serializers
from .models import Medicine, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']


class MedicineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name',
        read_only=True,
        allow_null=True
    )

    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Medicine
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at']



    def validate(self, data):
        expiry_date = data.get(
            'expiry_date',
            self.instance.expiry_date if self.instance else None
        )
        manufacture_date = data.get(
            'manufacture_date',
            self.instance.manufacture_date if self.instance else None
        )

        if expiry_date and manufacture_date and expiry_date <= manufacture_date:
            raise serializers.ValidationError(
                "Expiry date must be after manufacture date"
            )

        stock = data.get('stock')
        max_stock = data.get('max_stock')

        if stock is not None and max_stock is not None and stock > max_stock:
            raise serializers.ValidationError(
                "Stock cannot exceed maximum stock"
            )

        return data


class PublicMedicineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name',
        read_only=True,
        allow_null=True
    )

    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Medicine
        fields = '__all__'
        read_only_fields = ['status', 'created_at', 'updated_at']




class StockUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
    action = serializers.ChoiceField(choices=['ADD', 'REMOVE', 'SET'])
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        medicine = self.context.get('medicine')

        if medicine and data['action'] == 'REMOVE':
            if data['quantity'] > medicine.stock:
                raise serializers.ValidationError(
                    f"Cannot remove {data['quantity']} items. Only {medicine.stock} available."
                )

        return data
