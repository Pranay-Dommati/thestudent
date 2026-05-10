import hashlib
import hmac
import uuid
from django.conf import settings


class RazorpayError(Exception):
    pass


def create_razorpay_order(amount_paise, currency='INR', receipt=None):
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise RazorpayError('Razorpay keys are not configured')

    order_id = f"order_{uuid.uuid4().hex}"
    return {
        'id': order_id,
        'amount': amount_paise,
        'currency': currency,
        'receipt': receipt or order_id,
        'key_id': settings.RAZORPAY_KEY_ID,
    }


def verify_razorpay_signature(order_id, payment_id, signature):
    if not settings.RAZORPAY_KEY_SECRET:
        raise RazorpayError('Razorpay key secret is not configured')

    message = f"{order_id}|{payment_id}"
    digest = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(digest, signature)
