from django.urls import path
from . import views

urlpatterns = [
    path("create/", views.create_complaint),
    path("admin/all/", views.admin_complaints),
    path("admin/<int:pk>/update/", views.update_complaint_status),
]
