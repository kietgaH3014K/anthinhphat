"""Nghiệp vụ kho. Mọi hàm thay đổi tồn kho chạy trong transaction và khóa dòng tồn (select_for_update)
để hai khách đặt cùng lúc không thể bán vượt số lượng còn. (Khóa dòng chỉ có tác dụng trên PostgreSQL.)"""
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum

from common.exceptions import BusinessError

from .models import Inventory, InventoryTransaction as Tx, Warehouse


class InsufficientStock(BusinessError):
    def __init__(self, product, available):
        super().__init__(f"{product.name}: trong kho chỉ còn {available} {product.unit}.")
        self.product = product
        self.available = available


def _lock_row(product, warehouse):
    row, _ = Inventory.objects.get_or_create(product=product, warehouse=warehouse)
    return Inventory.objects.select_for_update().get(pk=row.pk)


def _record(row, change, kind, user, reference="", note="", unit_cost=None):
    actor = user if getattr(user, "is_authenticated", False) else None
    return Tx.objects.create(
        product_id=row.product_id, warehouse_id=row.warehouse_id, kind=kind, quantity_change=change,
        balance_after=row.quantity, unit_cost=unit_cost, reference=reference, note=note, created_by=actor,
    )


def total_stock(product):
    return Inventory.objects.filter(product=product).aggregate(t=Sum("quantity"))["t"] or 0


@transaction.atomic
def receive(product, warehouse, qty, user=None, unit_cost=None, reference="", note="", kind=Tx.IN):
    """Nhập kho; nếu có giá nhập thì cập nhật giá vốn theo bình quân gia quyền."""
    if qty <= 0:
        raise BusinessError("Số lượng nhập phải lớn hơn 0.")
    row = _lock_row(product, warehouse)
    if unit_cost is not None:
        unit_cost = Decimal(str(unit_cost))
        before = total_stock(product)
        product.cost_price = ((before * product.cost_price + qty * unit_cost) / (before + qty)).quantize(Decimal("1"))
        product.save(update_fields=["cost_price", "updated_at"])
    row.quantity += qty
    row.save(update_fields=["quantity", "updated_at"])
    return _record(row, qty, kind, user, reference, note, unit_cost)


@transaction.atomic
def issue(product, warehouse, qty, user=None, reference="", note=""):
    if qty <= 0:
        raise BusinessError("Số lượng xuất phải lớn hơn 0.")
    row = _lock_row(product, warehouse)
    if row.quantity < qty:
        raise InsufficientStock(product, row.quantity)
    row.quantity -= qty
    row.save(update_fields=["quantity", "updated_at"])
    return _record(row, -qty, Tx.OUT, user, reference, note)


@transaction.atomic
def adjust(product, warehouse, new_quantity, user=None, note="", kind=Tx.ADJUST):
    """Điều chỉnh / kiểm kê: đặt số lượng thực tế, ghi lại chênh lệch."""
    if new_quantity < 0:
        raise BusinessError("Số lượng thực tế không được âm.")
    row = _lock_row(product, warehouse)
    change = new_quantity - row.quantity
    if change == 0:
        return None
    row.quantity = new_quantity
    row.save(update_fields=["quantity", "updated_at"])
    return _record(row, change, kind, user, "", note)


@transaction.atomic
def allocate_sale(product, qty, reference, user=None):
    """Trừ kho khi bán, lấy từ kho nhiều hàng nhất trước; không đủ thì hủy toàn bộ giao dịch."""
    active = Warehouse.objects.filter(is_active=True).values("pk")
    rows = list(
        Inventory.objects.select_for_update()
        .filter(product=product, quantity__gt=0, warehouse_id__in=active)
        .order_by("-quantity", "pk")
    )
    available = sum(r.quantity for r in rows)
    if available < qty:
        raise InsufficientStock(product, available)
    remaining = qty
    for row in rows:
        take = min(row.quantity, remaining)
        row.quantity -= take
        row.save(update_fields=["quantity", "updated_at"])
        _record(row, -take, Tx.SALE, user, reference)
        remaining -= take
        if remaining == 0:
            break


@transaction.atomic
def restore_sale(reference, user=None):
    """Hoàn kho khi hủy đơn (chỉ hoàn một lần)."""
    if Tx.objects.filter(reference=reference, kind=Tx.SALE_CANCEL).exists():
        return
    for tx in Tx.objects.filter(reference=reference, kind=Tx.SALE).select_related("product", "warehouse"):
        row = _lock_row(tx.product, tx.warehouse)
        row.quantity += -tx.quantity_change
        row.save(update_fields=["quantity", "updated_at"])
        _record(row, -tx.quantity_change, Tx.SALE_CANCEL, user, reference, "Hủy đơn")
