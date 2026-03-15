from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.response import Response
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.html import escape
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
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
    #Get a specific bill
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
    #Create a new bill
    serializer = BillCreateSerializer(data=request.data)
    if serializer.is_valid():
        with transaction.atomic():
            bill = serializer.save()
            
            # Deduct stock for each item dynamically
            from inventory.models import Medicine
            try:
                for item in bill.items:
                    # bill.items looks like: [{"id": 1, "name": "...", "qty": 2, ...}]
                    # We should query either by name or by id. (Assuming name since existing analytics does that)
                    med_name = item.get("name")
                    qty = int(item.get("qty", 0))
                    
                    if med_name and qty > 0:
                        try:
                            med = Medicine.objects.get(name=med_name)
                            # Ensure stock doesn't go below 0
                            med.stock = max(0, med.stock - qty)
                            med.save()
                            
                            # Trigger low stock or out of stock alert
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
                            print(f"Medicine {med_name} not found, could not subtract stock.")
            except Exception as e:
                print(f"Error deducting stock: {str(e)}")
            
        # Automatically create an Order for delivery tracking
        try:
            # Find an available delivery person
            delivery_user = User.objects.filter(role="delivery", is_active=True).first()
            
            if delivery_user:
                Order.objects.create(
                    customer=bill.customer,
                    delivery_person=delivery_user,
                    total_amount=bill.total_amount,
                    status="pending"
                )
                print(f"Order created and assigned to {delivery_user.email}")
            else:
                # Still create order but without local delivery person assignment if none found
                Order.objects.create(
                    customer=bill.customer,
                    total_amount=bill.total_amount,
                    status="pending"
                )
                print("Order created but no delivery person available to assign.")
                
        except Exception as e:
            # Log error but don't fail the bill creation
            print(f"Failed to create delivery order: {str(e)}")

        # Trigger loyalty points for credit purchases
        if str(bill.payment_type).lower() == 'credit':
            try:
                from loyalty.services import process_credit_purchase
                process_credit_purchase(bill.customer, bill.total_amount)
                print(f"Loyalty logic triggered for credit purchase: {bill.total_amount}")
            except Exception as e:
                print(f"Failed to process loyalty for credit purchase: {str(e)}")

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customer_bills(request):
    #Get bills for the authenticated customer
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_bill(request, pk):
    """Download a specific bill as PDF"""
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
        
        # Try multiple PDF generation methods
        try:
            # First try weasyprint
            from weasyprint import HTML
            import io
            
            # Create PDF
            pdf_buffer = io.BytesIO()
            HTML(string=html_string).write_pdf(pdf_buffer)
            pdf_buffer.seek(0)
            
            # Create response
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="bill_{bill.invoice_number}.pdf"'
            return response
            
        except ImportError:
            # Try fpdf2 as fallback
            try:
                from fpdf import FPDF
                import io
                import re
                
                # Create a simple PDF with the bill information
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("Arial", size=12)
                
                # Add bill information
                pdf.set_font("Arial", "B", 16)
                pdf.cell(0, 10, f"Tax Invoice - {bill.invoice_number}", ln=True, align="C")
                pdf.ln(10)
                
                pdf.set_font("Arial", "B", 12)
                pdf.cell(0, 10, f"Customer: {bill.customer.email}", ln=True)
                pdf.cell(0, 10, f"Date: {bill.created_at.strftime('%Y-%m-%d')}", ln=True)
                pdf.ln(10)
                
                # Add items table header
                pdf.set_font("Arial", "B", 10)
                pdf.cell(80, 10, "Item", 1)
                pdf.cell(30, 10, "Qty", 1)
                pdf.cell(40, 10, "Price", 1)
                pdf.cell(40, 10, "Amount", 1)
                pdf.ln()
                
                # Add items
                pdf.set_font("Arial", size=10)
                raw_items = bill.items if isinstance(bill.items, list) else []
                for item in raw_items:
                    name = str(item.get('name', ''))[:30]  # Truncate long names
                    qty = str(item.get('qty', 0))
                    price = f"Rs {item.get('price', 0):.2f}"
                    amount = f"Rs {float(item.get('qty', 0)) * float(item.get('price', 0)):.2f}"
                    
                    pdf.cell(80, 10, name, 1)
                    pdf.cell(30, 10, qty, 1)
                    pdf.cell(40, 10, price, 1)
                    pdf.cell(40, 10, amount, 1)
                    pdf.ln()
                
                # Add totals
                pdf.ln(10)
                pdf.set_font("Arial", "B", 12)
                pdf.cell(150, 10, "Subtotal:", align="R")
                pdf.cell(40, 10, f"Rs {bill.subtotal:.2f}", 1)
                pdf.ln()
                
                pdf.cell(150, 10, "Discount:", align="R")
                pdf.cell(40, 10, f"Rs {bill.discount:.2f}", 1)
                pdf.ln()
                
                pdf.cell(150, 10, "Tax:", align="R")
                pdf.cell(40, 10, f"Rs {bill.tax_total:.2f}", 1)
                pdf.ln()
                
                pdf.cell(150, 10, "Total Amount:", align="R")
                pdf.cell(40, 10, f"Rs {bill.total_amount:.2f}", 1)
                pdf.ln()
                
                pdf.cell(150, 10, "Payment Status:", align="R")
                pdf.cell(40, 10, bill.payment_status.title(), 1)
                
                # Create PDF buffer
                pdf_buffer = io.BytesIO()
                pdf.output(pdf_buffer)
                pdf_buffer.seek(0)
                
                # Create response
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="bill_{bill.invoice_number}.pdf"'
                return response
                
            except ImportError:
                # If no PDF libraries available, return HTML as downloadable file
                response = HttpResponse(html_string, content_type='text/html')
                response['Content-Disposition'] = f'attachment; filename="bill_{bill.invoice_number}.html"'
                return response
            except Exception as e2:
                print(f"FPDF2 error: {e2}")
                # Return HTML as fallback
                response = HttpResponse(html_string, content_type='text/html')
                response['Content-Disposition'] = f'attachment; filename="bill_{bill.invoice_number}.html"'
                return response
        except Exception as e:
            # Handle any other PDF generation errors
            print(f"PDF generation error: {e}")
            # Return HTML as fallback
            response = HttpResponse(html_string, content_type='text/html')
            response['Content-Disposition'] = f'attachment; filename="bill_{bill.invoice_number}.html"'
            return response
        
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)


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
@api_view(['GET'])
@permission_classes([AllowAny])
def admin_print_bill(request, pk):
    """Generate a printable version of a specific bill for admin users"""
    
    # Support token in query parameter for window.open
    token = request.query_params.get('token')
    if token:
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            request.user = user
        except (InvalidToken, TokenError):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
    if request.user.role != 'admin':
        return Response({'error': 'Only admins can access this page'}, status=status.HTTP_403_FORBIDDEN)
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