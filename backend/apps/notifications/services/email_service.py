import logging

from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class EmailService:
    @classmethod
    def send_email(cls, to_address: str, subject: str, template_name: str, context: dict):
        try:
            html_message = render_to_string(f"emails/{template_name}.html", context)
            plain_text = context.get("message", subject)
            send_mail(
                subject=subject,
                message=plain_text,
                from_email=None,
                recipient_list=[to_address],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            logger.error("EmailService.send_email failed: %s", e)
