from django.urls import path
from . import views

urlpatterns = [
    # Bonuses
    path('bonuses/active/', views.active_bonuses),
    path('check-bonus/', views.check_bonus),
    # Bill Schemes
    path('bill-schemes/', views.bill_schemes),

    # Apply Scheme (creates AppliedScheme in DB)
    path('apply-scheme/', views.apply_bill_scheme),

    # User applied schemes history
    path('applied-schemes/me/', views.my_applied_schemes),
]
