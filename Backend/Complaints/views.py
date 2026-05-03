import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import Complaint
from .serializers import ComplaintSerializer
from notifications.email_utils import send_brevo_email

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_complaint(request):
    serializer = ComplaintSerializer(data=request.data)

    if serializer.is_valid():
        complaint = serializer.save(customer=request.user)
        return Response(
            {
                "message": "Complaint submitted successfully",
                "data": ComplaintSerializer(complaint).data
            },
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_complaints(request):
    complaints = Complaint.objects.all().order_by("-created_at")
    serializer = ComplaintSerializer(complaints, many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def update_complaint_status(request, pk):
    try:
        complaint = Complaint.objects.get(pk=pk)
    except Complaint.DoesNotExist:
        return Response({"error": "Complaint not found"}, status=404)

    new_status = request.data.get("status")

    if new_status not in ["Approved", "Rejected"]:
        return Response({"error": "Invalid status"}, status=400)

    complaint.status = new_status
    complaint.save(update_fields=["status"])

    try:
        send_complaint_email(complaint)
        logger.info(f"Complaint email sent → {complaint.customer.email}")
    except Exception as e:
        logger.error(f"Complaint email failed for pk={pk}: {str(e)}", exc_info=True)

    return Response({"message": f"Complaint {new_status} successfully"}, status=200)


def send_complaint_email(complaint):
    customer = complaint.customer

    if not customer.email:
        logger.warning(f"Complaint {complaint.pk} has no customer email, skipping.")
        return

    if complaint.status == "Approved":
        subject = "We Apologize - Complaint Acknowledged"
        message = f"""Dear Customer,

We sincerely apologize for the inconvenience caused regarding:

Medicine: {complaint.medicine_name}

We have reviewed your complaint and will sort this issue out as soon as possible.

Thank you for bringing this to our attention.

Regards,
Medistock Pro Team"""

    elif complaint.status == "Rejected":
        subject = "Complaint Review Update"
        message = f"""Dear Customer,

Your complaint regarding:

Medicine: {complaint.medicine_name}

has been reviewed and closed.

If you need further assistance, please contact support.

Regards,
Medistock Pro Team"""

    else:
        return

    send_brevo_email(subject, message, [customer.email])