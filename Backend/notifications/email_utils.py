import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_brevo_email(subject, message, recipient_list):
    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json"
    }

    for email in recipient_list:
        data = {
            "sender": {
                "name": "Medistock Pro",
                "email": settings.DEFAULT_FROM_EMAIL
            },
            "to": [{"email": email}],
            "subject": subject,
            "htmlContent": f"<p>{message.replace(chr(10), '<br>')}</p>"
        }

        response = requests.post(url, json=data, headers=headers, timeout=30)
        logger.info(f"Brevo response for {email}: {response.status_code} {response.text}")

        if response.status_code not in [200, 201, 202]:
            raise Exception(f"Brevo API error: {response.status_code} - {response.text}")