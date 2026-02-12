from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings

from .models import ExpiryReturnRequest
from .serializers import ExpiryReturnSerializer


# CUSTOMER APIs


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_expiry_return(request):
    serializer = ExpiryReturnSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(customer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_expiry_returns(request):
    returns = ExpiryReturnRequest.objects.filter(
        customer=request.user
    ).order_by("-created_at")

    serializer = ExpiryReturnSerializer(returns, many=True)
    return Response(serializer.data)



# ADMIN APIs


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_expiry_returns(request):
    returns = ExpiryReturnRequest.objects.all().order_by("-created_at")
    serializer = ExpiryReturnSerializer(returns, many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def update_expiry_status(request, pk):
    try:
        expiry_request = ExpiryReturnRequest.objects.get(id=pk)
    except ExpiryReturnRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    new_status = request.data.get("status")

    if new_status not in ["Approved", "Rejected"]:
        return Response({"error": "Invalid status"}, status=400)

    # Update Status
    expiry_request.status = new_status
    expiry_request.save()

    # Send Email Notification
    send_expiry_status_email(expiry_request)

    return Response({
        "message": f"Request {new_status} successfully and email sent"
    })



# EMAIL FUNCTION


def send_expiry_status_email(expiry_request):
    customer = expiry_request.customer

    # Skip if no email
    if not customer.email:
        return

    medicine = expiry_request.medicine
    quantity = expiry_request.quantity
    expiry_date = expiry_request.expiry_date
    status_value = expiry_request.status

    if status_value == "Approved":
        subject = "Expiry Return Approved - Medistock Pro"
        message = f"""
Dear,

Your expiry return request has been APPROVED.

Details:
Medicine: {medicine}
Quantity: {quantity}
Expiry Date: {expiry_date}

Please send the expired medicines to our store for verification and further processing.

Thank you for using Medistock Pro.

Regards,
Medistock Pro Team
"""
    else:
        subject = "Expiry Return Rejected - Medistock Pro"
        message = f"""
Dear {customer.username},

Your expiry return request has been REJECTED.

Details:
Medicine: {medicine}
Quantity: {quantity}
Expiry Date: {expiry_date}

For further clarification, please contact our support team.

Regards,
Medistock Pro Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [customer.email],
        fail_silently=False,
    )
