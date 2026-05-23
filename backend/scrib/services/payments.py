"""
Razorpay payment service for Scrib.

Uses the official razorpay-python SDK with LIVE keys loaded from Django settings.
The KEY_SECRET is never sent to the frontend.
"""
import hashlib
import hmac
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


class RazorpayError(Exception):
    pass


def _get_client():
    """Return an authenticated Razorpay client. Raises RazorpayError if keys missing."""
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if not key_id or not key_secret:
        raise RazorpayError('Razorpay keys are not configured')
    try:
        import razorpay  # type: ignore[import]
    except ImportError:
        raise RazorpayError('razorpay package is not installed. Run: pip install razorpay')
    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(amount_paise: int, currency: str = 'INR', receipt: str | None = None) -> dict:
    """
    Create a Razorpay order via the live API.

    Returns a dict with at minimum:
        id, amount, currency, receipt, key_id
    """
    client = _get_client()
    try:
        order = client.order.create({
            'amount': amount_paise,
            'currency': currency,
            'receipt': receipt or f'rcpt_{amount_paise}',
            'payment_capture': 1,  # auto-capture
        })
        logger.info('[payments] Razorpay order created: %s amount=%d', order.get('id'), amount_paise)
        order['key_id'] = settings.RAZORPAY_KEY_ID  # safe to add — it's the public key
        return order
    except Exception as exc:
        logger.error('[payments] Razorpay create_order failed: %s', exc)
        raise RazorpayError(f'Failed to create Razorpay order: {exc}') from exc


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Verify the Razorpay payment signature using HMAC-SHA256.

    The signature is: HMAC_SHA256(key=RAZORPAY_KEY_SECRET, msg=f"{order_id}|{payment_id}")
    Returns True if valid, False otherwise.
    """
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if not key_secret:
        raise RazorpayError('RAZORPAY_KEY_SECRET is not configured')

    message = f'{order_id}|{payment_id}'
    try:
        digest = hmac.new(
            key_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256,
        ).hexdigest()
    except Exception as exc:
        logger.error('[payments] Signature computation failed: %s', exc)
        raise RazorpayError(f'Signature verification error: {exc}') from exc

    result = hmac.compare_digest(digest, signature)
    if not result:
        logger.warning('[payments] Signature mismatch for order=%s payment=%s', order_id, payment_id)
    return result


def verify_webhook_signature(payload_body: bytes, razorpay_signature: str) -> bool:
    """
    Verify an inbound Razorpay webhook signature.

    Uses RAZORPAY_WEBHOOK_SECRET from settings.
    """
    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
    if not webhook_secret:
        logger.warning('[payments] RAZORPAY_WEBHOOK_SECRET not set — skipping webhook signature check')
        return False
    digest = hmac.new(
        webhook_secret.encode('utf-8'),
        payload_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(digest, razorpay_signature)
