from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Bonus, Gift, BillScheme, AppliedScheme
from .serializers import (
    BonusSerializer,
    GiftSerializer,
    BillSchemeSerializer,
    AppliedSchemeSerializer,
)


@api_view(["GET"])
def active_bonuses(request):
    bonuses = Bonus.objects.filter(is_active=True)
    return Response(BonusSerializer(bonuses, many=True).data)


@api_view(["GET"])
def gifts_list(request):
    gifts = Gift.objects.filter(is_active=True)
    return Response(GiftSerializer(gifts, many=True).data)


# Bonus Management CRUD

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_bonuses(request):
    if request.method == "GET":
        bonuses = Bonus.objects.all()
        return Response(BonusSerializer(bonuses, many=True).data)
    
    serializer = BonusSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def manage_bonus_detail(request, pk):
    try:
        bonus = Bonus.objects.get(pk=pk)
    except Bonus.DoesNotExist:
        return Response(
            {"detail": "Bonus not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    
    if request.method == "GET":
        return Response(BonusSerializer(bonus).data)
    
    if request.method == "PUT":
        serializer = BonusSerializer(bonus, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    bonus.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bill_schemes(request):
    today = timezone.localdate()

    schemes = (
        BillScheme.objects.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        )
        .prefetch_related("gifts")
    )

    from Billing.models import Bill

    total_purchase = (
        Bill.objects.filter(
            customer=request.user,
            payment_status__in=["paid", "due"],
        )
        .aggregate(total=models.Sum("total_amount"))["total"]
        or 0
    )

    response = []

    for scheme in schemes:
        data = BillSchemeSerializer(scheme).data
        data["customer_total_purchase"] = float(total_purchase)

        if total_purchase >= float(scheme.min_bill_amount):
            data["unlocked"] = True
        else:
            data["unlocked"] = False
            data["remaining_to_unlock"] = (
                float(scheme.min_bill_amount) - float(total_purchase)
            )

        response.append(data)

    return Response(response)



# Admin CRUD

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_bill_schemes(request):
    if request.method == "GET":
        schemes = BillScheme.objects.prefetch_related("gifts").all()
        return Response(BillSchemeSerializer(schemes, many=True).data)

    serializer = BillSchemeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def manage_bill_scheme_detail(request, pk):
    try:
        scheme = BillScheme.objects.prefetch_related("gifts").get(pk=pk)
    except BillScheme.DoesNotExist:
        return Response(
            {"detail": "Scheme not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(BillSchemeSerializer(scheme).data)

    if request.method == "PUT":
        serializer = BillSchemeSerializer(scheme, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    scheme.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)



# Scheme Application


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_bill_scheme(request):
    scheme_id = request.data.get("scheme_id")
    gift_ids = request.data.get("gift_ids", [])

    if not scheme_id or not isinstance(gift_ids, list) or not gift_ids:
        return Response(
            {"detail": "scheme_id and gift_ids are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    today = timezone.localdate()

    with transaction.atomic():
        scheme = (
            BillScheme.objects.select_for_update()
            .filter(
                id=scheme_id,
                is_active=True,
                start_date__lte=today,
                end_date__gte=today,
            )
            .prefetch_related("gifts")
            .first()
        )

        if not scheme:
            return Response({"detail": "Scheme not available."}, status=404)

        gifts = scheme.gifts.filter(id__in=gift_ids, is_active=True)
        if gifts.count() != len(set(gift_ids)):
            return Response({"detail": "Invalid gift selection."}, status=400)

        total_value = sum(Decimal(str(g.value)) for g in gifts)

        if total_value > Decimal(str(scheme.remaining_gift_value)):
            return Response({"detail": "Insufficient gift balance."}, status=400)

        scheme.remaining_gift_value -= total_value
        scheme.save()

        applied = AppliedScheme.objects.create(
            customer=request.user,
            scheme=scheme,
            total_gift_value=total_value,
        )
        applied.selected_gifts.set(gifts)

    return Response(AppliedSchemeSerializer(applied).data, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_scheme_to_bill(request):
    bill_id = request.data.get("bill_id")
    scheme_id = request.data.get("scheme_id")
    gift_ids = request.data.get("selected_gift_ids", [])

    if not bill_id or not scheme_id or not gift_ids:
        return Response({"detail": "Invalid request data."}, status=400)

    today = timezone.localdate()
    from Billing.models import Bill

    with transaction.atomic():
        try:
            bill = Bill.objects.get(id=bill_id, customer=request.user)
        except Bill.DoesNotExist:
            return Response({"detail": "Bill not found."}, status=404)

        scheme = (
            BillScheme.objects.select_for_update()
            .filter(
                id=scheme_id,
                is_active=True,
                start_date__lte=today,
                end_date__gte=today,
            )
            .prefetch_related("gifts")
            .first()
        )

        if not scheme:
            return Response({"detail": "Scheme not available."}, status=404)

        gifts = scheme.gifts.filter(id__in=gift_ids, is_active=True)
        if gifts.count() != len(set(gift_ids)):
            return Response({"detail": "Invalid gift selection."}, status=400)

        total_value = sum(Decimal(str(g.value)) for g in gifts)

        if total_value > Decimal(str(scheme.remaining_gift_value)):
            return Response({"detail": "Insufficient gift balance."}, status=400)

        scheme.remaining_gift_value -= total_value
        scheme.save()

        applied = AppliedScheme.objects.create(
            customer=request.user,
            scheme=scheme,
            total_gift_value=total_value,
        )
        applied.selected_gifts.set(gifts)

    return Response(AppliedSchemeSerializer(applied).data, status=201)



# User Data


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_applied_schemes(request):
    schemes = (
        AppliedScheme.objects.filter(customer=request.user)
        .select_related("scheme")
        .prefetch_related("selected_gifts")
    )
    return Response(AppliedSchemeSerializer(schemes, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_applied_schemes(request):
    """Admin view to see all applied schemes"""
    schemes = (
        AppliedScheme.objects.select_related("customer", "scheme")
        .prefetch_related("selected_gifts")
        .all()
    )
    return Response(AppliedSchemeSerializer(schemes, many=True).data)




@api_view(["POST"])
def check_bonus(request):
    medicine_id = request.data.get("medicine_id")
    qty = int(request.data.get("qty", 0))

    if not medicine_id or qty <= 0:
        return Response({"free_qty": 0})

    today = timezone.localdate()

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

    return Response(
        {
            "buy_quantity": bonus.buy_quantity,
            "free_quantity": bonus.free_quantity,
            "free_qty": free_qty,
        }
    )
