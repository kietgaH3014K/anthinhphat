from django.conf import settings
from django.db import models
from django.db.models import Q

from catalog.models import Product
from common.models import TimeStampedModel


class Warehouse(TimeStampedModel):
    name = models.CharField("Tên kho", max_length=120, unique=True)
    address = models.CharField("Địa chỉ", max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Kho"
        verbose_name_plural = "Kho"

    def __str__(self):
        return self.name


class Inventory(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="inventory_rows")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="inventory_rows")
    quantity = models.IntegerField(default=0)

    class Meta:
        unique_together = [("product", "warehouse")]
        constraints = [models.CheckConstraint(check=Q(quantity__gte=0), name="inventory_quantity_non_negative")]
        verbose_name = "Tồn kho"
        verbose_name_plural = "Tồn kho"


class InventoryTransaction(models.Model):
    IN, OUT, ADJUST, STOCKTAKE, SALE, SALE_CANCEL = "in", "out", "adjust", "stocktake", "sale", "sale_cancel"
    KINDS = [
        (IN, "Nhập hàng"), (OUT, "Xuất hàng"), (ADJUST, "Điều chỉnh"), (STOCKTAKE, "Kiểm kê"),
        (SALE, "Bán hàng"), (SALE_CANCEL, "Hoàn kho do hủy đơn"),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="inventory_transactions")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="transactions")
    kind = models.CharField(max_length=12, choices=KINDS, db_index=True)
    quantity_change = models.IntegerField()
    balance_after = models.IntegerField()
    unit_cost = models.DecimalField(max_digits=14, decimal_places=0, null=True, blank=True)
    reference = models.CharField(max_length=60, blank=True, db_index=True)
    note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
