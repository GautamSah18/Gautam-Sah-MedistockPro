import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "MedistockPro.settings")

# Initialize Django ASGI app first
django_asgi_app = get_asgi_application()

# Import after Django setup
import notifications.routing
from Authentication.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    # HTTP requests
    "http": django_asgi_app,

    # WebSocket requests
    "websocket": JWTAuthMiddleware(
        URLRouter(
            notifications.routing.websocket_urlpatterns
        )
    ),
})