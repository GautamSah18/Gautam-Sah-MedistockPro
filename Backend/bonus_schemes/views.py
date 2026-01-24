from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Bonus

from .models import Bonus, Gift, BillScheme, AppliedScheme
from .serializers import BonusSerializer, BillSchemeSerializer, AppliedSchemeSerializer


@api_view(['GET'])
def active_bonuses(request):
    qs = Bonus.objects.filter(is_active=True)
    return Response(BonusSerializer(qs, many=True).data)


@api_view(['GET'])
def bill_schemes(request):
    today = timezone.localdate()
    qs = BillScheme.objects.filter(is_active=True, start_date__lte=today, end_date__gte=today).prefetch_related('gifts')
    return Response(BillSchemeSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_bill_scheme(request):
    """
    Body:
    {
      "scheme_id": 1,
      "gift_ids": [2,3]
    }
    """
    scheme_id = request.data.get('scheme_id')
    gift_ids = request.data.get('gift_ids', [])

    if not scheme_id or not isinstance(gift_ids, list) or len(gift_ids) == 0:
        return Response({"detail": "scheme_id and gift_ids are required."}, status=status.HTTP_400_BAD_REQUEST)

    today = timezone.localdate()

    with transaction.atomic():
        scheme = (
            BillScheme.objects.select_for_update()
            .prefetch_related('gifts')
            .filter(id=scheme_id, is_active=True, start_date__lte=today, end_date__gte=today)
            .first()
        )
        if not scheme:
            return Response({"detail": "Scheme not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        # Only allow gifts that belong to this scheme
        gifts = scheme.gifts.filter(id__in=gift_ids, is_active=True).distinct()
        if gifts.count() != len(set(gift_ids)):
            return Response({"detail": "One or more gifts are invalid for this scheme."}, status=status.HTTP_400_BAD_REQUEST)

        total_value = sum(float(g.value) for g in gifts)

        if total_value > float(scheme.remaining_gift_value):
            return Response({"detail": "Not enough remaining gift value in this scheme."}, status=status.HTTP_400_BAD_REQUEST)

        # reduce remaining value
        scheme.remaining_gift_value = float(scheme.remaining_gift_value) - total_value
        scheme.save()

        applied = AppliedScheme.objects.create(
            customer=request.user,
            scheme=scheme,
            total_gift_value=total_value
        )
        applied.selected_gifts.set(gifts)

    return Response(AppliedSchemeSerializer(applied).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applied_schemes(request):
    qs = AppliedScheme.objects.filter(customer=request.user).select_related('scheme').prefetch_related('selected_gifts')
    return Response(AppliedSchemeSerializer(qs, many=True).data)

@api_view(["POST"])
def check_bonus(request):
    medicine_id = request.data.get("medicine_id")
    qty = int(request.data.get("qty", 0))

    if not medicine_id or qty <= 0:
        return Response({"free_qty": 0})

    today = timezone.now().date()

    bonus = (
        Bonus.objects.filter(
            medicine_id=medicine_id,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        )
        .order_by("-id")
        .first()
    )

    if not bonus:
        return Response({"free_qty": 0})

    free_qty = (qty // bonus.buy_quantity) * bonus.free_quantity
    return Response({
        "buy_quantity": bonus.buy_quantity,
        "free_quantity": bonus.free_quantity,
        "free_qty": free_qty
    })
