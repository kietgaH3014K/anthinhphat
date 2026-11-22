import uuid
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models

from catalog.models import Product
from common.models import TimeStampedModel


def private_storage():
    """File khách gửi nằm ngoài thư mục public; chỉ nhân viên tải được qua API có kiểm tra quyền."""
    return FileSystemStorage(location=settings.PRIVATE_MEDIA_ROOT)


def attachment_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return f"quotes/{uuid.uuid4().hex}.{ext}"


class Quotation(TimeStampedModel):
    RECEIVED, QUOTING, SENT, ACCEPTED, REJECTED = "received", "quoting", "sent", "accepted", "rejected"
    STATUS = [(RECEIVED, "Đã nhận"), (QUOTING, "Đang báo giá"), (SENT, "Đã gửi báo giá"), (ACCEPTED, "Khách chấp nhận"), (REJECTED, "Khách từ chối")]

    code = models.CharField(max_length=30, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="quotations")
    contact_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    company = models.CharField(max_length=200, blank=True)
    site_address = models.CharField(max_length=255)
    desired_date = models.DateField()
    note = models.TextField(blank=True, max_length=2000)
    attachment = models.FileField(upload_to=attachment_path, storage=private_storage, null=True, blank=True)
    attachment_name = models.CharField(max_length=200, blank=True)

    status = models.CharField(max_length=10, choices=STATUS, default=RECEIVED, db_index=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    valid_until = models.DateField(null=True, blank=True)
    staff_note = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Báo giá"
        verbose_name_plural = "Báo giá"

    def totals(self):
        subtotal = sum((i.line_total for i in self.items.all()), Decimal(0))
        discount = (subtotal * self.discount_percent / Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        return {"subtotal": subtotal, "discount": discount, "shipping": self.shipping_fee, "total": subtotal - discount + self.shipping_fee}

    def fully_priced(self):
        items = list(self.items.all())
        return bool(items) and all(i.unit_price is not None for i in items)


class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    product_name = models.CharField(max_length=255)
    unit = models.CharField(max_length=30)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=14, decimal_places=0, null=True, blank=True)

    @property
    def line_total(self):
        return (self.unit_price or Decimal(0)) * self.quantity
