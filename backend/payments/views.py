import razorpay
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response



PACKS = {
    "starter": {
        "credits": 10,
        "amount": 4900
    },
    "popular": {
        "credits": 20,
        "amount": 9900
    },
    "pro": {
        "credits": 40,
        "amount": 19900
    }
}

@api_view(["POST"])
def create_order(request):
    pack = request.data.get("pack")
    
    client = razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET
        )
    )
    
    if pack not in PACKS:
        return Response({"error": "Invalid pack"}, status=400)

    selected = PACKS[pack]

    order = client.order.create({
        "amount": selected["amount"],
        "currency": "INR",
        "payment_capture": 1
    })

    return Response({
        "order_id": order["id"],
        "amount": selected["amount"],
        "key": settings.RAZORPAY_KEY_ID,
        "credits": selected["credits"]
    })
