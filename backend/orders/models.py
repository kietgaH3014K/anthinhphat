from django.conf import settings
from django.db import models

from catalog.models import Product
from common.models import TimeStampedModel


class ShippingAddress(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses")
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    district = models.CharField(max_length=100)
    city = models.CharField(max_length=100, default="TP. Hồ Chí Minh")
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_default", "-created_at"]


class SalesOrder(TimeStampedModel):
    PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED = "pending", "confirmed", "shipping", "completed", "cancelled"
    STATUS = [(PENDING, "Chờ xác nhận"), (CONFIRMED, "Đã xác nhận"), (SHIPPING, "Đang giao"), (COMPLETED, "Hoàn thành"), (CANCELLED, "Đã hủy")]
    COD, BANK = "cod", "bank_transfer"
    METHODS = [(COD, "Thanh toán khi nhận hàng"), (BANK, "Chuyển khoản ngân hàng")]
    UNPAID, PAID = "unpaid", "paid"

    code = models.CharField(max_length=30, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=10, choices=STATUS, default=PENDING, db_index=True)
    payment_method = models.CharField(max_length=15, choices=METHODS)
    payment_status = models.CharField(max_length=10, default=UNPAID)
    subtotal = models.DecimalField(max_digits=14, decimal_places=0)
    discount = models.DecimalField(max_digits=14, decimal_places=0, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=0)
    coupon_code = models.CharField(max_length=30, blank=True)
    is_wholesale = models.BooleanField(default=False)
    ship_full_name = models.CharField(max_length=150)
    ship_phone = models.CharField(max_length=20)
    ship_address = models.CharField(max_length=255)
    ship_district = models.CharField(max_length=100)
    ship_city = models.CharField(max_length=100)
    note = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Đơn hàng"
        verbose_name_plural = "Đơn hàng"


class OrderItem(models.Model):
    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=30)
    qty = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=14, decimal_places=0)
    line_total = models.DecimalField(max_digits=14, decimal_places=0)


class Payment(TimeStampedModel):
    PENDING, PAID, FAILED = "pending", "paid", "failed"

    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=14, decimal_places=0)
    status = models.CharField(max_length=10, default=PENDING)
    reference = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
