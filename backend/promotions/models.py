from django.db import models

from common.models import TimeStampedModel


class Promotion(TimeStampedModel):
    code = models.CharField("Mã", max_length=30, unique=True)
    description = models.CharField(max_length=200, blank=True)
    percent = models.DecimalField("Giảm (%)", max_digits=5, decimal_places=2)
    min_order = models.DecimalField("Đơn tối thiểu", max_digits=14, decimal_places=0, default=0)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0, editable=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Khuyến mãi"
        verbose_name_plural = "Khuyến mãi"

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        self.code = self.code.strip().upper()
        super().save(*args, **kwargs)
