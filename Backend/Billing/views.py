from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.response import Response
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Bill
from .serializers import BillSerializer, BillCreateSerializer
from OrderStatusTracking.models import Order
from Authentication.models import CustomUser as User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_bills(request):
    """List all bills"""
    bills = Bill.objects.all()
    serializer = BillSerializer(bills, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bill(request, pk):
    """Get a specific bill"""
    try:
        try:
            bill = Bill.objects.get(pk=pk)
        except (ValueError, TypeError):
            bill = Bill.objects.get(invoice_number=pk)
        
        serializer = BillSerializer(bill)
        return Response(serializer.data)
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_bill(request):
    """Create a new bill"""
    serializer = BillCreateSerializer(data=request.data)
    if serializer.is_valid():
        with transaction.atomic():
            bill = serializer.save()
            
            # Deduct stock for each item dynamically
            from inventory.models import Medicine
            try:
                for item in bill.items:
                    med_name = item.get("name")
                    qty = int(item.get("qty", 0))
                    
                    if med_name and qty > 0:
                        try:
                            med = Medicine.objects.get(name=med_name)
                            med.stock = max(0, med.stock - qty)
                            med.save()
                            
                            from notifications.services import notify_admins
                            from notifications.models import Notification
                            if med.stock == 0:
                                msg = f"ALERT: {med.name} is completely Out of Stock following a recent purchase!"
                                if not Notification.objects.filter(message=msg, is_read=False, user__is_staff=True).exists():
                                    notify_admins(msg, notification_type="medicine")
                            elif med.stock <= med.min_stock:
                                msg = f"WARNING: {med.name} stock has fallen below the minimum limit ({med.stock} remaining)."
                                if not Notification.objects.filter(message=msg, is_read=False, user__is_staff=True).exists():
                                    notify_admins(msg, notification_type="medicine")
                                    
                        except Medicine.DoesNotExist:
                            print(f"Medicine {med_name} not found.")
            except Exception as e:
                print(f"Error deducting stock: {str(e)}")
            
        # Automatically create an Order for delivery tracking
        try:
            delivery_user = User.objects.filter(role="delivery", is_active=True).first()
            if delivery_user:
                Order.objects.create(customer=bill.customer, delivery_person=delivery_user, total_amount=bill.total_amount, status="pending")
            else:
                Order.objects.create(customer=bill.customer, total_amount=bill.total_amount, status="pending")
        except Exception as e:
            print(f"Failed to create delivery order: {str(e)}")

        # Trigger loyalty points for credit purchases
        if str(bill.payment_type).lower() == 'credit':
            try:
                from loyalty.services import process_credit_purchase
                process_credit_purchase(bill.customer, bill.total_amount)
            except Exception as e:
                print(f"Failed to process loyalty for credit purchase: {str(e)}")

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customer_bills(request):
    """Get bills for the authenticated customer"""
    if request.user.role != 'customer':
        return Response({'error': 'Only customers can access their bills'}, status=status.HTTP_403_FORBIDDEN)
    
    bills = Bill.objects.filter(customer=request.user)
    serializer = BillSerializer(bills, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customer_orders(request):
    """Get orders for the authenticated customer"""
    if request.user.role != 'customer':
        return Response({'error': 'Only customers can access their orders'}, status=status.HTTP_403_FORBIDDEN)
    
    bills = Bill.objects.filter(customer=request.user).order_by('-created_at')
    serializer = BillSerializer(bills, many=True)
    return Response(serializer.data)


def _get_bill_html_context(bill):
    """Helper method to generate structured HTML context for any bill"""
    raw_items = bill.items if isinstance(bill.items, list) else []
    processed_items = []
    total_qty = 0
    
    for item in raw_items:
        qty = int(item.get('qty', 0))
        price = float(item.get('price', 0))
        tax_per_unit = price * 0.05  # 5% tax rate
        amount = qty * (price + tax_per_unit)
        
        processed_items.append({
            'name': item.get('name', ''),
            'qty': qty,
            'price': round(price, 2),
            'tax_per_unit': round(tax_per_unit, 2),
            'amount': round(amount, 2),
        })
        total_qty += qty
    
    context = {
        'bill': bill,
        'items': processed_items,
        'total_qty': total_qty,
        'company': {
            'name': 'Medistock Pro',
            'address': 'Inaruwa',
            'phone': '025-561152',
            'pan': 'PAN-674364646',
        }
    }
    return render_to_string('billing/print_bill.html', context)


@api_view(['GET'])
@permission_classes([AllowAny])
def print_bill(request, pk):
    """Generate a printable HTML version of a specific bill for customers securely via query token"""
    token = request.query_params.get('token')
    if token:
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            request.user = jwt_auth.get_user(validated_token)
        except (InvalidToken, TokenError):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)
            
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        try:
            bill = Bill.objects.get(pk=pk)
        except (ValueError, TypeError):
            bill = Bill.objects.get(invoice_number=pk)
        
        if request.user.role != 'admin' and bill.customer != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        return HttpResponse(_get_bill_html_context(bill))
        
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_print_bill(request, pk):
    """Generate a printable HTML version of a specific bill for admin users securely via query token"""
    token = request.query_params.get('token')
    if token:
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            request.user = jwt_auth.get_user(validated_token)
        except (InvalidToken, TokenError):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
    if request.user.role != 'admin':
        return Response({'error': 'Only admins can access this page'}, status=status.HTTP_403_FORBIDDEN)
        
    try:
        bill = get_object_or_404(Bill, pk=pk)
    except (ValueError, TypeError):
        bill = get_object_or_404(Bill, invoice_number=pk)
    
    return HttpResponse(_get_bill_html_context(bill))