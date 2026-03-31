"""
WSGI config for MedistockPro project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MedistockPro.settings')

application = get_wsgi_application()
# filepath: c:\Users\Acer\Desktop\Medistock Pro\Backend\settings.py
INSTALLED_APPS = [
    # ...existing apps...
    'Authentication',  # Ensure this is correctly spelled and included
    # ...existing apps...
]