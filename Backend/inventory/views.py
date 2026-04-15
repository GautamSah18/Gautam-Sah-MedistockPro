from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta
import traceback

from .models import Medicine, Category, SeasonalMedicine
from .utils import get_current_season
from .serializers import (
    MedicineSerializer,
    CategorySerializer,
    StockUpdateSerializer,
    PublicMedicineSerializer,
    SeasonalMedicineSerializer,
    PublicSeasonalMedicineSerializer
)
from .permissions import IsAdmin


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_fields = ['status', 'category_type', 'is_active']
    search_fields = ['name', 'generic_name', 'company', 'batch_no']
    ordering_fields = ['name', 'stock', 'expiry_date', 'created_at']

    def create(self, request, *args, **kwargs):
        try:
            print("REQUEST DATA:", request.data)
            print("REQUEST FILES:", request.FILES)

            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print("SERIALIZER ERRORS:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            print("MEDICINE CREATE ERROR:", str(e))
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        medicine = self.get_object()
        serializer = StockUpdateSerializer(
            data=request.data,
            context={'medicine': medicine}
        )

        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data['action'] == 'ADD':
            medicine.stock += data['quantity']
        elif data['action'] == 'REMOVE':
            medicine.stock -= data['quantity']
        else:
            medicine.stock = data['quantity']

        medicine.save()

        return Response({
            'message': 'Stock updated successfully',
            'new_stock': medicine.stock,
            'status': medicine.status
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        thirty_days_later = today + timedelta(days=30)

        return Response({
            'total_medicines': Medicine.objects.count(),
            'total_stock_value': Medicine.objects.aggregate(
                total=Sum(F('stock') * F('cost_price'))
            )['total'] or 0,
            'low_stock_count': Medicine.objects.filter(
                stock__gt=0,
                stock__lte=F('min_stock')
            ).count(),
            'out_of_stock_count': Medicine.objects.filter(stock=0).count(),
            'expired_count': Medicine.objects.filter(
                expiry_date__lt=today
            ).count(),
            'expiring_soon_count': Medicine.objects.filter(
                expiry_date__range=[today, thirty_days_later]
            ).count()
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
    queryset = Medicine.objects.filter(is_active=True, stock__gt=0)
    serializer_class = PublicMedicineSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_fields = ['status', 'category_type']
    search_fields = ['name', 'generic_name', 'company', 'batch_no']
    ordering_fields = ['name', 'stock', 'expiry_date', 'created_at']

    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class SeasonalMedicineViewSet(viewsets.ModelViewSet):
    queryset = SeasonalMedicine.objects.all()
    serializer_class = SeasonalMedicineSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['medicine__name']
    filterset_fields = ['season']


class PublicSeasonalMedicineViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PublicSeasonalMedicineSerializer

    def get_queryset(self):
        season = get_current_season()
        return SeasonalMedicine.objects.filter(
            season=season,
            medicine__is_active=True,
            medicine__stock__gt=0
        )

    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        season = get_current_season()
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        medicines = [item['medicine'] for item in serializer.data if item.get('medicine')]
        return Response({
            "season": season,
            "medicines": medicines
        })