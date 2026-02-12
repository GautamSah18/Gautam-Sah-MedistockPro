from django.urls import path
from . import views

urlpatterns = [

    # Customer
    path("create/", views.create_expiry_return, name="create_expiry_return"),
    path("my-returns/", views.my_expiry_returns, name="my_expiry_returns"),

    # Admin
    path("admin/all/", views.admin_expiry_returns, name="admin_expiry_returns"),
    path("admin/<int:pk>/update/", views.update_expiry_status, name="update_expiry_status"),
]
