from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """Lớp cơ sở: thời điểm tạo và cập nhật cho mọi bảng nghiệp vụ."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SiteConfig(models.Model):
    """Cấu hình thương hiệu, một dòng duy nhất (Admin sửa, không cần deploy lại)."""

    company_name = models.CharField("Tên công ty", max_length=150, default="AN THỊNH PHÁT")
    hotline = models.CharField("Hotline", max_length=30, blank=True)
    zalo_url = models.URLField("Liên kết Zalo", blank=True)
    messenger_url = models.URLField("Liên kết Messenger", blank=True)
    address = models.CharField("Địa chỉ", max_length=255, blank=True)
    bank_info = models.TextField("Thông tin chuyển khoản", blank=True)
    shipping_flat_fee = models.DecimalField("Phí vận chuyển cố định", max_digits=12, decimal_places=0, default=50000)
    free_ship_from = models.DecimalField("Miễn phí vận chuyển từ", max_digits=12, decimal_places=0, default=5000000)

    class Meta:
        verbose_name = "Cấu hình website"
        verbose_name_plural = "Cấu hình website"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    link = models.CharField(max_length=200, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    action = models.CharField(max_length=60, db_index=True)
    target = models.CharField(max_length=120, blank=True)
    detail = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
