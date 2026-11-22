from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from common.models import TimeStampedModel


class Role(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    MANAGER = "manager", "Quản lý"
    SALES = "sales", "Nhân viên bán hàng"
    WAREHOUSE = "warehouse", "Nhân viên kho"
    CUSTOMER = "customer", "Khách hàng"


STAFF_ROLES = (Role.SUPER_ADMIN, Role.MANAGER, Role.SALES, Role.WAREHOUSE)


class User(AbstractUser):
    """Người dùng tùy chỉnh. Đăng nhập bằng email; role quyết định phân quyền API."""

    email = models.EmailField("Email", unique=True)
    phone = models.CharField("Số điện thoại", max_length=20, blank=True)
    role = models.CharField("Vai trò", max_length=20, choices=Role.choices, default=Role.CUSTOMER, db_index=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "Người dùng"
        verbose_name_plural = "Người dùng"

    @property
    def is_staff_role(self):
        return self.role in STAFF_ROLES


class CustomerGroup(TimeStampedModel):
    """Nhóm khách hàng gắn chính sách chiết khấu (vd: Đại lý cấp 1)."""

    name = models.CharField("Tên nhóm", max_length=100, unique=True)
    discount_percent = models.DecimalField("Chiết khấu (%)", max_digits=5, decimal_places=2, default=0)
    description = models.TextField("Mô tả", blank=True)

    class Meta:
        verbose_name = "Nhóm khách hàng"
        verbose_name_plural = "Nhóm khách hàng"

    def __str__(self):
        return self.name


class WholesaleStatus(models.TextChoices):
    NONE = "none", "Không phải khách sỉ"
    PENDING = "pending", "Chờ duyệt"
    APPROVED = "approved", "Đã duyệt"
    REJECTED = "rejected", "Từ chối"


class CustomerProfile(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    company_name = models.CharField("Tên công ty", max_length=200, blank=True)
    tax_code = models.CharField("Mã số thuế", max_length=20, blank=True)
    wholesale_status = models.CharField(
        "Trạng thái khách sỉ", max_length=10, choices=WholesaleStatus.choices, default=WholesaleStatus.NONE, db_index=True
    )
    customer_group = models.ForeignKey(
        CustomerGroup, null=True, blank=True, on_delete=models.SET_NULL, related_name="profiles"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="approved_profiles"
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Hồ sơ khách hàng"
        verbose_name_plural = "Hồ sơ khách hàng"
        indexes = [models.Index(fields=["tax_code"])]

    def __str__(self):
        return self.company_name or self.user.email
