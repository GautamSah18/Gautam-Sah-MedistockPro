# filepath: c:\Users\Acer\Desktop\Medistock Pro\Backend\MedistockPro\urls.py
from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from Authentication import views
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



urlpatterns = [
    path('', RedirectView.as_view(url='admin/', permanent=False)),
    path('admin/', admin.site.urls),

    # Swagger URLs
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # JWT Authentication endpoints
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Authentication endpoints
    path('api/auth/register/step1/', views.registration_step1, name='registration_step1'),
    path('api/auth/register/step2/', views.registration_step2, name='registration_step2'),
    path('api/auth/login/', views.user_login, name='login'),
    path('api/auth/logout/', views.logout_view, name='logout'),
    path('api/auth/profile/', views.user_profile, name='user_profile'),

    # Protected endpoints
    path('api/dashboard/', views.dashboard, name='dashboard'),
    path('api/inventory/', include('inventory.urls')),
    path('inventory/', include('inventory.urls')),
    path('api/billing/', include('Billing.urls')),
    path('api/bonus-schemes/', include('bonus_schemes.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
