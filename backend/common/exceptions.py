from rest_framework import status
from rest_framework.exceptions import APIException


class BusinessError(APIException):
    """Lỗi nghiệp vụ (hết hàng, mã giảm giá sai…). Trả về 400 với {"detail": "..."}."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Yêu cầu không hợp lệ."
    default_code = "business_error"
