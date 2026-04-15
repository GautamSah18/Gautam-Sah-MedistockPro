import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MedistockPro.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(email='gautamsah4271@gmail.com').exists():
    User.objects.create_superuser(email='gautamsah4271@gmail.com', password='Admin@123')
    print('Superuser created!')
else:
    print('Superuser already exists.')