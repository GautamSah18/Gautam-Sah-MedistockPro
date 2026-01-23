from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Bonus, Gift, BillScheme, AppliedBonus, AppliedScheme
from .serializers import (
    BonusSerializer, GiftSerializer, BillSchemeSerializer,
    AppliedBonusSerializer, AppliedSchemeSerializer,
    EligibleSchemesSerializer, CartBonusCheckSerializer
)
from inventory.models import Medicine


class BonusViewSet(viewsets.ModelViewSet):
    queryset = Bonus.objects.all()
    serializer_class = BonusSerializer
    
    def get_queryset(self):
        queryset = Bonus.objects.all()
        # Filter active bonuses
        if self.action == 'list':
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now()
            )
        return queryset
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all currently active bonuses"""
        active_bonuses = self.get_queryset().filter(
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
        serializer = self.get_serializer(active_bonuses, many=True)
        return Response(serializer.data)


class GiftViewSet(viewsets.ModelViewSet):
    queryset = Gift.objects.all()
    serializer_class = GiftSerializer
    
    def get_queryset(self):
        queryset = Gift.objects.all()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset


class BillSchemeViewSet(viewsets.ModelViewSet):
    queryset = BillScheme.objects.all()
    serializer_class = BillSchemeSerializer
    
    def get_queryset(self):
        queryset = BillScheme.objects.all()
        # Filter active schemes
        if self.action == 'list':
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now()
            )
        return queryset
    
    @action(detail=False, methods=['post'])
    def check_eligibility(self, request):
        """Check which schemes are eligible for a given cart total"""
        serializer = EligibleSchemesSerializer(data=request.data)
        if serializer.is_valid():
            cart_total = serializer.validated_data['cart_total']
            
            eligible_schemes = BillScheme.objects.filter(
                is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now(),
                min_bill_amount__lte=cart_total
            ).order_by('min_bill_amount')
            
            response_data = {
                'cart_total': cart_total,
                'eligible_schemes': BillSchemeSerializer(eligible_schemes, many=True).data
            }
            return Response(response_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def apply_scheme(self, request):
        """Apply a scheme to a bill"""
        bill_id = request.data.get('bill_id')
        scheme_id = request.data.get('scheme_id')
        selected_gift_ids = request.data.get('selected_gift_ids', [])
        
        if not all([bill_id, scheme_id]):
            return Response(
                {'error': 'bill_id and scheme_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from Billing.models import Bill
            bill = Bill.objects.get(id=bill_id)
            scheme = BillScheme.objects.get(id=scheme_id, is_active=True)
        except Bill.DoesNotExist:
            return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)
        except BillScheme.DoesNotExist:
            return Response({'error': 'Scheme not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if bill total meets minimum requirement
        if bill.total_amount < scheme.min_bill_amount:
            return Response(
                {'error': f'Bill total (Rs {bill.total_amount}) is less than required minimum (Rs {scheme.min_bill_amount})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate selected gifts
        selected_gifts = Gift.objects.filter(
            id__in=selected_gift_ids,
            is_active=True,
            schemes=scheme
        )
        
        if len(selected_gifts) != len(selected_gift_ids):
            return Response({'error': 'Invalid or unavailable gifts selected'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate total gift value
        total_gift_value = sum(gift.value for gift in selected_gifts)
        
        if total_gift_value > scheme.gift_value_limit:
            return Response(
                {'error': f'Total gift value (Rs {total_gift_value}) exceeds limit (Rs {scheme.gift_value_limit})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update applied scheme
        applied_scheme, created = AppliedScheme.objects.update_or_create(
            bill=bill,
            scheme=scheme,
            defaults={
                'total_gift_value': total_gift_value
            }
        )
        applied_scheme.selected_gifts.set(selected_gifts)
        
        serializer = AppliedSchemeSerializer(applied_scheme)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class AppliedBonusViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AppliedBonus.objects.all()
    serializer_class = AppliedBonusSerializer


class AppliedSchemeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AppliedScheme.objects.all()
    serializer_class = AppliedSchemeSerializer
