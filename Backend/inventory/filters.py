import django_filters
from .models import Medicine

class MedicineFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    company = django_filters.CharFilter(lookup_expr='icontains')
    batch_no = django_filters.CharFilter(lookup_expr='icontains')
    min_stock = django_filters.NumberFilter(field_name='stock', lookup_expr='gte')
    max_stock = django_filters.NumberFilter(field_name='stock', lookup_expr='lte')
    expiry_date_from = django_filters.DateFilter(field_name='expiry_date', lookup_expr='gte')
    expiry_date_to = django_filters.DateFilter(field_name='expiry_date', lookup_expr='lte')
    status = django_filters.ChoiceFilter(choices=Medicine.STATUS_CHOICES)
    category_type = django_filters.ChoiceFilter(choices=Medicine.CATEGORY_CHOICES)
    
    class Meta:
        model = Medicine
        fields = ['name', 'company', 'batch_no', 'status', 'category_type',
                 'is_active']