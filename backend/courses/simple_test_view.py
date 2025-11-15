"""
Minimal test view used by pro_learning_urls.py

Provides a simple JSON response for GET/POST and supports CORS/OPTIONS.
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json


def _corsify(response: JsonResponse) -> JsonResponse:
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def simple_test_view(request):
    """A tiny health/test endpoint.

    - GET: returns a status payload
    - POST: echoes back JSON body if valid
    - OPTIONS: CORS preflight
    """
    if request.method == "OPTIONS":
        return _corsify(JsonResponse({"status": "ok"}))

    if request.method == "GET":
        return _corsify(
            JsonResponse({
                "status": "success",
                "message": "simple_test_view is reachable",
            })
        )

    # POST
    try:
        payload = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        payload = None

    return _corsify(
        JsonResponse({
            "status": "success",
            "message": "POST received",
            "received_data": payload,
        })
    )
