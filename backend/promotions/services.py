from django.utils import timezone

from common.exceptions import BusinessError

from .models import Promotion

INVALID = "Mã giảm giá không hợp lệ hoặc đã hết hạn."


def apply_coupon(code, subtotal=None, consume=False):
    """Kiểm tra mã giảm giá. consume=True (trong transaction đặt hàng) sẽ khóa dòng và tăng số lần dùng."""
    code = (code or "").strip().upper()
    qs = Promotion.objects.select_for_update() if consume else Promotion.objects
    promo = qs.filter(code=code).first()
    now = timezone.now()
    if not promo or not promo.is_active:
        raise BusinessError(INVALID)
    if (promo.starts_at and promo.starts_at > now) or (promo.ends_at and promo.ends_at < now):
        raise BusinessError(INVALID)
    if promo.max_uses is not None and promo.used_count >= promo.max_uses:
        raise BusinessError("Mã giảm giá đã hết lượt sử dụng.")
    if subtotal is not None and subtotal < promo.min_order:
        raise BusinessError(f"Đơn hàng cần tối thiểu {int(promo.min_order):,} đ để dùng mã này.".replace(",", "."))
    if consume:
        promo.used_count += 1
        promo.save(update_fields=["used_count", "updated_at"])
    return promo
