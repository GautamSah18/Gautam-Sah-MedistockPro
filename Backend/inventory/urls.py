from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'medicines', views.MedicineViewSet, basename='medicine')
router.register(r'categories', views.CategoryViewSet, basename='category')

# Add public medicine viewset
public_router = DefaultRouter()
public_router.register(r'medicines', views.PublicMedicineViewSet, basename='public-medicine')

urlpatterns = [
    path('', include(router.urls)),
    path('public/', include(public_router.urls)),  # Public API for customers
]