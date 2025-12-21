from rest_framework import serializers
from .models import Medicine, Category
from django.utils import timezone

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']

class MedicineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'generic_name', 'company', 'category_type', 'category',
            'category_name', 'batch_no', 'manufacture_date', 'expiry_date',
            'stock', 'min_stock', 'max_stock', 'unit', 'cost_price', 'selling_price',
            'mrp', 'status', 'is_active', 'description', 'storage_conditions',
            'created_by', 'updated_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Validate expiry date
        if 'expiry_date' in data or 'manufacture_date' in data:
            expiry_date = data.get('expiry_date', self.instance.expiry_date if self.instance else None)
            manufacture_date = data.get('manufacture_date', self.instance.manufacture_date if self.instance else None)
            
            if expiry_date and manufacture_date and expiry_date <= manufacture_date:
                raise serializers.ValidationError("Expiry date must be after manufacture date")
        
        # Validate stock limits
        if 'stock' in data and 'max_stock' in data:
            if data['stock'] > data['max_stock']:
                raise serializers.ValidationError("Stock cannot exceed maximum stock")
        
        return data

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