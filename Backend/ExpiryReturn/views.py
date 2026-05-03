import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import ExpiryReturnRequest
from .serializers import ExpiryReturnSerializer
from notifications.email_utils import send_brevo_email

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_expiry_return(request):
    serializer = ExpiryReturnSerializer(data=request.data)

    if serializer.is_valid():
        expiry_request = serializer.save(customer=request.user)
        return Response(
            {
                "message": "Expiry return request submitted successfully",
                "data": ExpiryReturnSerializer(expiry_request).data
            },
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_expiry_returns(request):
    returns = ExpiryReturnRequest.objects.filter(
        customer=request.user
    ).order_by("-created_at")

    serializer = ExpiryReturnSerializer(returns, many=True)
    return Response(serializer.data)


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

    expiry_request.status = new_status
    expiry_request.save(update_fields=["status"])

    try:
        send_expiry_status_email(expiry_request)
        logger.info(f"Expiry return email sent → {expiry_request.customer.email}")
    except Exception as e:
        logger.error(f"Expiry return email failed for pk={pk}: {str(e)}", exc_info=True)

    return Response({
        "message": f"Request {new_status} successfully"
    }, status=200)


def send_expiry_status_email(expiry_request):
    customer = expiry_request.customer

    if not customer.email:
        logger.warning(f"ExpiryReturn {expiry_request.pk} has no customer email, skipping.")
        return

    medicine = expiry_request.medicine
    quantity = expiry_request.quantity
    expiry_date = expiry_request.expiry_date
    status_value = expiry_request.status

    if status_value == "Approved":
        subject = "Expiry Return Approved - Medistock Pro"
        message = f"""Dear Customer,

Your expiry return request has been APPROVED.

Details:
Medicine: {medicine}
Quantity: {quantity}
Expiry Date: {expiry_date}

Please send the expired medicines to our store for verification and further processing.

Thank you for using Medistock Pro.

Regards,
Medistock Pro Team"""

    elif status_value == "Rejected":
        subject = "Expiry Return Rejected - Medistock Pro"
        message = f"""Dear Customer,

Your expiry return request has been REJECTED.

Details:
Medicine: {medicine}
Quantity: {quantity}
Expiry Date: {expiry_date}

For further clarification, please contact our support team.

Regards,
Medistock Pro Team"""

    else:
        return

    send_brevo_email(subject, message, [customer.email])