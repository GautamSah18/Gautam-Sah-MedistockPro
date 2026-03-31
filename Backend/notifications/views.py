from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, is_read=False)

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"status": "success"})

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_single_notification_read(request, pk):
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({"status": "success"})
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=404)
