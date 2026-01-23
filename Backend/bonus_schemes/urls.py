from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'bonuses', views.BonusViewSet)
router.register(r'gifts', views.GiftViewSet)
router.register(r'bill-schemes', views.BillSchemeViewSet)
router.register(r'applied-bonuses', views.AppliedBonusViewSet)
router.register(r'applied-schemes', views.AppliedSchemeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
