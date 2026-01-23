from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_bills, name='list_bills'),


    path('create/', views.create_bill, name='create_bill'),
    path('my-bills/', views.get_customer_bills, name='get_customer_bills'),
    path('admin/<str:pk>/print/', views.admin_print_bill, name='admin_print_bill'),
    path('<str:pk>/print/', views.print_bill, name='print_bill'),
    path('<str:pk>/', views.get_bill, name='get_bill'),
]
