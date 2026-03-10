from django.urls import path
from .views import admin_dashboard_analytics

urlpatterns = [
    path("admin/dashboard/", admin_dashboard_analytics),
]