from decimal import ROUND_HALF_UP, Decimal

from accounts.permissions import can_view_wholesale_price


def wholesale_price_for(product, user):
    """Giá sỉ áp dụng cho user: giá riêng theo nhóm, nếu không có thì giá sỉ chung trừ chiết khấu nhóm."""
    if product.wholesale_price is None:
        return None
    profile = getattr(user, "profile", None)
    group = profile.customer_group if profile else None
    if group:
        for gp in product.group_prices.all():
            if gp.customer_group_id == group.id:
                return gp.price
        if group.discount_percent:
            price = product.wholesale_price * (Decimal(100) - group.discount_percent) / Decimal(100)
            return price.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return product.wholesale_price


def unit_price(product, qty, user):
    """Đơn giá thực tế. Backend là nơi duy nhất quyết định, không tin giá do client gửi."""
    if can_view_wholesale_price(user):
        ws = wholesale_price_for(product, user)
        if ws is not None and qty >= product.min_wholesale_qty:
            return ws
    return product.retail_price
