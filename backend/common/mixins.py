from django.db.models import ProtectedError

from .exceptions import BusinessError


class SafeDeleteMixin:
    """Xóa bản ghi đang được tham chiếu (đơn hàng, sản phẩm…) trả về lỗi dễ hiểu thay vì lỗi 500."""

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            raise BusinessError("Dữ liệu này đang được sử dụng nên không thể xóa. Hãy chuyển sang ngừng sử dụng.")
