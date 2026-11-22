from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone

from catalog.models import Product
from catalog.pricing import unit_price
from common.exceptions import BusinessError
from common.models import SiteConfig
from common.services import audit, notify
from common.text import new_code
from inventory import services as inventory
from promotions.services import apply_coupon

from .models import OrderItem, Payment, SalesOrder

TRANSITIONS = {
    SalesOrder.PENDING: {SalesOrder.CONFIRMED, SalesOrder.CANCELLED},
    SalesOrder.CONFIRMED: {SalesOrder.SHIPPING, SalesOrder.CANCELLED},
    SalesOrder.SHIPPING: {SalesOrder.COMPLETED},
    SalesOrder.COMPLETED: set(),
    SalesOrder.CANCELLED: set(),
}
STATUS_LABEL = dict(SalesOrder.STATUS)


def calc_shipping(amount, config):
    return Decimal(0) if amount >= config.free_ship_from else config.shipping_flat_fee


@transaction.atomic
def place_order(user, items, address, payment_method, coupon_code=None, note=""):
    """Tạo đơn. Giá, giảm giá, phí ship và tồn kho đều do backend tính; mọi thứ nằm trong một giao dịch,
    nếu một sản phẩm hết hàng thì toàn bộ đơn (kể cả lượt dùng mã) bị hủy."""
    merged = {}
    for it in items:
        merged[it["product_id"]] = merged.get(it["product_id"], 0) + it["qty"]
    products = {p.id: p for p in Product.objects.filter(id__in=list(merged), status=Product.ACTIVE, category__is_active=True)}
    if set(merged) - set(products):
        raise BusinessError("Có sản phẩm không còn được bán. Vui lòng cập nhật giỏ hàng.")

    lines, subtotal, wholesale = [], Decimal(0), False
    for pid in sorted(merged):  # khóa theo thứ tự cố định để tránh deadlock
        product, qty = products[pid], merged[pid]
        price = unit_price(product, qty, user)
        wholesale = wholesale or price != product.retail_price
        lines.append((product, qty, price, price * qty))
        subtotal += price * qty

    discount, coupon = Decimal(0), ""
    if coupon_code and coupon_code.strip():
        promo = apply_coupon(coupon_code, subtotal, consume=True)
        discount = (subtotal * promo.percent / Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        coupon = promo.code

    shipping = calc_shipping(subtotal - discount, SiteConfig.get())
    code = new_code("ATP")
    order = SalesOrder.objects.create(
        code=code, user=user, payment_method=payment_method, subtotal=subtotal, discount=discount,
        shipping_fee=shipping, total=subtotal - discount + shipping, coupon_code=coupon, is_wholesale=wholesale,
        ship_full_name=address["full_name"], ship_phone=address["phone"], ship_address=address["address"],
        ship_district=address["district"], ship_city=address.get("city") or "TP. Hồ Chí Minh", note=note or "",
    )
    for product, qty, price, line in lines:
        inventory.allocate_sale(product, qty, code, user)
        OrderItem.objects.create(order=order, product=product, name=product.name, unit=product.unit, qty=qty, unit_price=price, line_total=line)
    Payment.objects.create(order=order, method=payment_method, amount=order.total)
    notify(user, f"Đã nhận đơn hàng {code}", link=f"/don-hang/{code}")
    return order


@transaction.atomic
def change_status(order_id, new_status, user, by_customer=False):
    order = SalesOrder.objects.select_for_update().get(pk=order_id)
    if new_status not in TRANSITIONS[order.status]:
        raise BusinessError(f"Không thể chuyển đơn từ “{STATUS_LABEL[order.status]}” sang “{STATUS_LABEL.get(new_status, new_status)}”.")
    if by_customer and not (order.user_id == user.id and order.status == SalesOrder.PENDING and new_status == SalesOrder.CANCELLED):
        raise BusinessError("Bạn chỉ hủy được đơn đang chờ xác nhận.")
    if new_status == SalesOrder.CANCELLED:
        inventory.restore_sale(order.code, user)
    if new_status == SalesOrder.COMPLETED and order.payment_method == SalesOrder.COD:
        _mark_paid(order)
    order.status = new_status
    order.save(update_fields=["status", "payment_status", "updated_at"])
    notify(order.user, f"Đơn {order.code}: {STATUS_LABEL[new_status]}", link=f"/don-hang/{order.code}")
    audit(user, "order.status", order.code, status=new_status)
    return order


def _mark_paid(order):
    order.payment_status = SalesOrder.PAID
    order.payments.filter(status=Payment.PENDING).update(status=Payment.PAID, paid_at=timezone.now())


@transaction.atomic
def mark_paid(order_id, user):
    order = SalesOrder.objects.select_for_update().get(pk=order_id)
    if order.status == SalesOrder.CANCELLED:
        raise BusinessError("Đơn đã hủy.")
    _mark_paid(order)
    order.save(update_fields=["payment_status", "updated_at"])
    audit(user, "order.paid", order.code)
    return order
