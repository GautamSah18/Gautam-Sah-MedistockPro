from django.urls import path
from . import views

urlpatterns = [
    path("", views.NotificationListView.as_view(), name="notification-list"),
    path("mark-read/", views.mark_notifications_read, name="mark-notifications-read"),
    path("<int:pk>/mark-read/", views.mark_single_notification_read, name="mark-single-notification-read"),
]
