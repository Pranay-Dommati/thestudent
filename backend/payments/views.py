"""
payments app views — Deprecated stub.

All payment functionality has moved to the scrib app:
  POST /api/scrib/payments/create-order/
  POST /api/scrib/payments/verify/
  GET  /api/scrib/payments/history/
  POST /api/scrib/payments/webhook/

This file is kept for backward compatibility only.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def payment_info(request):
    """Redirect information — payment endpoints have moved to /api/scrib/payments/."""
    return Response({
        'message': 'Payment endpoints have moved.',
        'endpoints': {
            'create_order': '/api/scrib/payments/create-order/',
            'verify': '/api/scrib/payments/verify/',
            'history': '/api/scrib/payments/history/',
            'webhook': '/api/scrib/payments/webhook/',
        }
    })
