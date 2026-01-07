from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta

from .models import Medicine, Category
from .serializers import MedicineSerializer, CategorySerializer, StockUpdateSerializer, PublicMedicineSerializer
from .permissions import IsAdmin

class MedicineViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]  # Only admin can access inventory
    queryset = Medicine.objects.all().select_related('category')
    serializer_class = MedicineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category_type', 'is_active']
    search_fields = ['name', 'generic_name', 'company', 'batch_no']
    ordering_fields = ['name', 'stock', 'expiry_date', 'created_at']
    
    def perform_create(self, serializer):
        # You can get username from request if available
        username = getattr(self.request.user, 'username', 'admin') if hasattr(self.request, 'user') else 'admin'
        serializer.save(created_by=username)
    
    def perform_update(self, serializer):
        username = getattr(self.request.user, 'username', 'admin') if hasattr(self.request, 'user') else 'admin'
        serializer.save(updated_by=username)
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        medicine = self.get_object()
        serializer = StockUpdateSerializer(data=request.data, context={'medicine': medicine})
        
        if serializer.is_valid():
            data = serializer.validated_data
            action_type = data['action']
            quantity = data['quantity']
            
            if action_type == 'ADD':
                medicine.stock += quantity
            elif action_type == 'REMOVE':
                medicine.stock -= quantity
            else:  # SET
                medicine.stock = quantity
            
            medicine.save()
            
            return Response({
                'message': f'Stock updated successfully',
                'new_stock': medicine.stock,
                'status': medicine.status
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_medicines = Medicine.objects.count()
        total_stock_value = Medicine.objects.aggregate(
            total=Sum(F('stock') * F('cost_price'))
        )['total'] or 0
        
        low_stock_count = Medicine.objects.filter(
            stock__gt=0,
            stock__lte=F('min_stock')
        ).count()
        
        out_of_stock_count = Medicine.objects.filter(stock=0).count()
        
        today = timezone.now().date()
        expired_count = Medicine.objects.filter(expiry_date__lt=today).count()
        
        thirty_days_later = today + timedelta(days=30)
        expiring_soon_count = Medicine.objects.filter(
            expiry_date__range=[today, thirty_days_later]
        ).count()
        
        return Response({
            'total_medicines': total_medicines,
            'total_stock_value': total_stock_value,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'expired_count': expired_count,
            'expiring_soon_count': expiring_soon_count,
        })
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        medicines = Medicine.objects.filter(
            stock__gt=0,
            stock__lte=F('min_stock')
        ).order_by('stock')
        serializer = self.get_serializer(medicines, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        today = timezone.now().date()
        thirty_days_later = today + timedelta(days=30)
        
        medicines = Medicine.objects.filter(
            expiry_date__range=[today, thirty_days_later]
        ).order_by('expiry_date')
        serializer = self.get_serializer(medicines, many=True)
        return Response(serializer.data)


class PublicMedicineViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for authenticated users to view medicines
    """
    queryset = Medicine.objects.filter(is_active=True, stock__gt=0).select_related('category')
    serializer_class = PublicMedicineSerializer  # Updated to use public serializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category_type', 'is_active']
    search_fields = ['name', 'generic_name', 'company', 'batch_no']
    ordering_fields = ['name', 'stock', 'expiry_date', 'created_at']
    permission_classes = []  # Will be set to allow authenticated users only

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        from rest_framework.permissions import IsAuthenticated
        permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]  # Only admin can access inventory
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']