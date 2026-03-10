# filepath: Backend/MedistockPro/urls.py

from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from django.views.generic import RedirectView

# Swagger schema view
schema_view = get_schema_view(
    openapi.Info(
        title="MedistockPro API",
        default_version='v1',
        description="API documentation for MedistockPro project",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# Add Bearer Auth manually
schema_view.security = [{'Bearer': []}]
schema_view.security_definitions = {
    'Bearer': {
        'type': 'apiKey',
        'name': 'Authorization',
        'in': 'header',
        'description': 'Enter: Bearer <your access token>'
    }
}

urlpatterns = [
    # Redirect root to Django Admin
    path('', RedirectView.as_view(url='admin/', permanent=False)),
    path('admin/', admin.site.urls),

    # Swagger Documentation
    re_path(
        r'^swagger(?P<format>\.json|\.yaml)$',
        schema_view.without_ui(cache_timeout=0),
        name='schema-json'
    ),
    path(
        'swagger/',
        schema_view.with_ui('swagger', cache_timeout=0),
        name='schema-swagger-ui'
    ),
    path(
        'redoc/',
        schema_view.with_ui('redoc', cache_timeout=0),
        name='schema-redoc'
    ),

    # JWT Authentication
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Authentication App
    path('api/auth/', include('Authentication.urls')),

    # Dashboard Analytics App
    path('api/dashboard/', include('dashboard.urls')),

    # Inventory
    path('api/inventory/', include('inventory.urls')),
    path('inventory/', include('inventory.urls')),

    # Billing
    path('api/billing/', include('Billing.urls')),

    # Bonus Schemes
    path('api/bonus-schemes/', include('bonus_schemes.urls')),

    # Expiry Return
    path("api/expiry-return/", include("ExpiryReturn.urls")),

    # Complaints
    path("api/complaints/", include("Complaints.urls")),

    # Notifications
    path("api/notifications/", include("notifications.urls")),

    # Order Tracking
    path("api/orders/", include("OrderStatusTracking.urls")),

    #ai docs verification
    path("api/verification/", include("verification.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)