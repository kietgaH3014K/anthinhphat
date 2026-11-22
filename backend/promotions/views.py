from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .services import apply_coupon


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle, UserRateThrottle])
def validate_coupon(request):
    promo = apply_coupon(request.data.get("code"))
    return Response({"code": promo.code, "percent": promo.percent})
