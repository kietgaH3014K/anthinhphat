"""Phân quyền tập trung. Quyền xem giá sỉ LUÔN được quyết định tại backend."""
from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Role, WholesaleStatus


def can_view_wholesale_price(user):
    """Chỉ nhân viên nội bộ hoặc khách sỉ đã được Admin duyệt mới thấy giá sỉ."""
    if not user or not user.is_authenticated or not user.is_active:
        return False
    if user.role in (Role.SUPER_ADMIN, Role.MANAGER, Role.SALES):
        return True
    profile = getattr(user, "profile", None)
    return bool(profile and profile.wholesale_status == WholesaleStatus.APPROVED)


class HasRole(BasePermission):
    """Dùng: permission_classes = [HasRole.of(Role.MANAGER, Role.SUPER_ADMIN)]"""

    allowed_roles = ()

    @classmethod
    def of(cls, *roles):
        return type("HasRoleFor" + "".join(r.title() for r in roles), (cls,), {"allowed_roles": tuple(roles)})

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.role in self.allowed_roles)


IsSuperAdmin = HasRole.of(Role.SUPER_ADMIN)
IsManagerOrAbove = HasRole.of(Role.SUPER_ADMIN, Role.MANAGER)
IsSalesStaff = HasRole.of(Role.SUPER_ADMIN, Role.MANAGER, Role.SALES)
IsWarehouseStaff = HasRole.of(Role.SUPER_ADMIN, Role.MANAGER, Role.WAREHOUSE)


class IsApprovedWholesale(BasePermission):
    message = "Tài khoản chưa được duyệt là khách mua sỉ."

    def has_permission(self, request, view):
        return can_view_wholesale_price(request.user)


# Nhóm vai trò dùng cho API quản trị
ALL_STAFF = (Role.SUPER_ADMIN, Role.MANAGER, Role.SALES, Role.WAREHOUSE)
SALES_UP = (Role.SUPER_ADMIN, Role.MANAGER, Role.SALES)
MANAGER_UP = (Role.SUPER_ADMIN, Role.MANAGER)
WAREHOUSE_UP = (Role.SUPER_ADMIN, Role.MANAGER, Role.WAREHOUSE)
SUPER_ONLY = (Role.SUPER_ADMIN,)


class StaffReadWrite(BasePermission):
    """View khai báo read_roles (GET/HEAD/OPTIONS) và write_roles (các phương thức còn lại)."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_active):
            return False
        roles = view.read_roles if request.method in SAFE_METHODS else view.write_roles
        return user.role in roles
