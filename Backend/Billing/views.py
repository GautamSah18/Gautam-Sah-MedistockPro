from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.html import escape
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Bill
from .serializers import BillSerializer, BillCreateSerializer


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
        # First try to find by numerical ID, then by invoice number
        try:
            bill = Bill.objects.get(pk=pk)
        except (ValueError, TypeError):
            # If pk is not a number, it might be an invoice number
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
        serializer.save()
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


# API view for customer-facing print functionality
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def print_bill(request, pk):
    """Generate a printable version of a specific bill"""
    try:
        # First try to find by numerical ID, then by invoice number
        try:
            bill = Bill.objects.get(pk=pk)
        except (ValueError, TypeError):
            # If pk is not a number, it might be an invoice number
            bill = Bill.objects.get(invoice_number=pk)
        
        # Check if user has permission to view this bill
        # Admins can view all bills, customers can only view their own
        if request.user.role != 'admin' and bill.customer != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Convert items JSON to a format suitable for template
        raw_items = bill.items if isinstance(bill.items, list) else []
        
        # Process items to calculate tax and total per item
        processed_items = []
        total_qty = 0
        
        for item in raw_items:
            qty = int(item.get('qty', 0))
            price = float(item.get('price', 0))
            tax_per_unit = price * 0.05  # Assuming 5% tax rate
            amount = qty * (price + tax_per_unit)
            
            processed_items.append({
                'name': item.get('name', ''),
                'qty': qty,
                'price': round(price, 2),
                'tax_per_unit': round(tax_per_unit, 2),
                'amount': round(amount, 2),
            })
            
            total_qty += qty
        
        # Create context for template
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
        
        # Render HTML template
        html_string = render_to_string('billing/print_bill.html', context)
        
        # Return HTML response
        return HttpResponse(html_string)
        
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)


# Django view for admin print functionality
@login_required
@staff_member_required
def admin_print_bill(request, pk):
    """Generate a printable version of a specific bill for admin users"""
    # First try to find by numerical ID, then by invoice number
    try:
        bill = get_object_or_404(Bill, pk=pk)
    except (ValueError, TypeError):
        # If pk is not a number, it might be an invoice number
        bill = get_object_or_404(Bill, invoice_number=pk)
    
    # For admin users, we can access any bill
    # Convert items JSON to a format suitable for template
    raw_items = bill.items if isinstance(bill.items, list) else []
    
    # Process items to calculate tax and total per item
    processed_items = []
    total_qty = 0
    
    for item in raw_items:
        qty = int(item.get('qty', 0))
        price = float(item.get('price', 0))
        tax_per_unit = price * 0.05  # Assuming 5% tax rate
        amount = qty * (price + tax_per_unit)
        
        processed_items.append({
            'name': item.get('name', ''),
            'qty': qty,
            'price': round(price, 2),
            'tax_per_unit': round(tax_per_unit, 2),
            'amount': round(amount, 2),
        })
        
        total_qty += qty
    
    # Create context for template
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
    
    # Render HTML template
    html_string = render_to_string('billing/print_bill.html', context)
    
    # Return HTML response
    return HttpResponse(html_string)