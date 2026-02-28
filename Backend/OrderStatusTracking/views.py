from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Order
from .serializers import OrderSerializer

User = get_user_model()


# =========================================
#  Customer Creates Order
# =========================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):

    if request.user.role != "customer":
        return Response({"error": "Only customers can create orders"}, status=403)

    order = Order.objects.create(
        customer=request.user,
        total_amount=request.data.get("total_amount"),
        status="received",
        delivery_person=None,
        is_accepted=False
    )

    serializer = OrderSerializer(order)
    return Response(serializer.data)


# =========================================
# Delivery Dashboard - Show Orders
# =========================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delivery_orders(request):

    if request.user.role != "delivery":
        return Response({"error": "Unauthorized"}, status=403)


    orders = Order.objects.filter(
        Q(delivery_person__isnull=True) |
        Q(delivery_person=request.user)
    ).order_by("-created_at")

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


# =========================================
#  Accept Order (Manual Assignment)
# =========================================
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def accept_order(request, pk):

    if request.user.role != "delivery":
        return Response({"error": "Unauthorized"}, status=403)

    try:
        order = Order.objects.get(id=pk)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    # Prevent double acceptance
    if order.delivery_person and order.delivery_person != request.user:
        return Response({"error": "Order already accepted by another delivery person"}, status=400)

    order.delivery_person = request.user
    order.is_accepted = True
    order.save()

    serializer = OrderSerializer(order)
    return Response(serializer.data)


# =========================================
# Update Order Status
# =========================================
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_order_status(request, pk):

    if request.user.role != "delivery":
        return Response({"error": "Unauthorized"}, status=403)

    try:
        order = Order.objects.get(id=pk, delivery_person=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    new_status = request.data.get("status")

    # Validate status
    valid_statuses = dict(Order.STATUS_CHOICES).keys()

    if new_status not in valid_statuses:
        return Response({"error": "Invalid status"}, status=400)

    order.status = new_status
    order.save()

    serializer = OrderSerializer(order)
    return Response(serializer.data)


# =========================================
#  Customer Dashboard - View Own Orders
# =========================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_orders(request):

    if request.user.role != "customer":
        return Response({"error": "Unauthorized"}, status=403)

    orders = Order.objects.filter(customer=request.user).order_by("-created_at")

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

# =========================================
#  Admin Dashboard - can view Orders
# =========================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_orders(request):

    if request.user.role != "admin":
        return Response({"error": "Unauthorized"}, status=403)

    orders = Order.objects.all().order_by("-created_at")
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)