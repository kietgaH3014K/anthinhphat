from django.conf import settings
from django.db import models

from catalog.models import Product
from common.models import TimeStampedModel
from inventory.models import Warehouse


class Supplier(TimeStampedModel):
    name = models.CharField("Nhà cung cấp", max_length=200)
    contact_name = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    tax_code = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Nhà cung cấp"
        verbose_name_plural = "Nhà cung cấp"

    def __str__(self):
        return self.name


class PurchaseOrder(TimeStampedModel):
    DRAFT, ORDERED, RECEIVED, CANCELLED = "draft", "ordered", "received", "cancelled"
    STATUS = [(DRAFT, "Nháp"), (ORDERED, "Đã đặt"), (RECEIVED, "Đã nhập kho"), (CANCELLED, "Đã hủy")]

    code = models.CharField(max_length=30, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchase_orders")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="purchase_orders")
    status = models.CharField(max_length=10, choices=STATUS, default=DRAFT, db_index=True)
    note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="+")
    quantity = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=14, decimal_places=0)
