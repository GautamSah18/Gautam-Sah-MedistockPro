from django.urls import path
from . import views

urlpatterns = [
    # Bonuses
    path('bonuses/active/', views.active_bonuses),
    path('check-bonus/', views.check_bonus),
    # Bonus Management (Admin CRUD)
    path('bonuses/', views.manage_bonuses),
    path('bonuses/<int:pk>/', views.manage_bonus_detail),
    # Gifts
    path('gifts/', views.gifts_list),
    # Bill Schemes
    path('bill-schemes/', views.bill_schemes),
    path('bill-schemes/manage/', views.manage_bill_schemes),
    path('bill-schemes/<int:pk>/', views.manage_bill_scheme_detail),

    # Apply Scheme (creates AppliedScheme in DB)
    path('apply-scheme/', views.apply_bill_scheme),
    path('bill-schemes/apply_scheme/', views.apply_scheme_to_bill),

    # User applied schemes history
    path('applied-schemes/me/', views.my_applied_schemes),
    # Admin view of all applied schemes
    path('applied-schemes/all/', views.all_applied_schemes),
]
