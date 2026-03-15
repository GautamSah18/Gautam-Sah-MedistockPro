from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path('dashboard/', views.customer_loyalty_dashboard, name='customer_loyalty_dashboard'),
    path('transactions/', views.customer_loyalty_transactions, name='customer_loyalty_transactions'),
    path('credit-bills/', views.customer_credit_bills, name='customer_credit_bills'),
    path('pay-credit-bill/<int:bill_id>/', views.pay_credit_bill, name='pay_credit_bill'),

    # Admin endpoints
    path('admin/accounts/', views.admin_all_loyalty_accounts, name='admin_all_loyalty_accounts'),
    path('admin/credit-bills/', views.admin_all_credit_bills, name='admin_all_credit_bills'),
    path('admin/pay-credit-bill/<int:bill_id>/', views.admin_pay_credit_bill, name='admin_pay_credit_bill'),
]
