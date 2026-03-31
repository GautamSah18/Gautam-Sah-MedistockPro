from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_order),
    path("delivery/", views.delivery_orders),
    path("<int:pk>/accept/", views.accept_order),
    path("<int:pk>/update-status/", views.update_order_status),
    path("customer/", views.customer_orders),
    path("admin/", views.admin_orders),
]