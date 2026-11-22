"""API quản trị: /api/v1/manage/… (mỗi view tự khai báo vai trò được phép)."""
from django.urls import path
from rest_framework.routers import SimpleRouter

from accounts.admin_api import CustomerAdminViewSet, CustomerGroupViewSet, StaffViewSet
from catalog.admin_api import BrandAdminViewSet, CategoryAdminViewSet, ProductAdminViewSet, ReviewAdminViewSet
from common import admin_api as common_admin
from inventory.admin_api import InventoryViewSet, TransactionViewSet, WarehouseViewSet
from orders.admin_api import OrderAdminViewSet
from promotions.admin_api import PromotionViewSet
from quotations.views import QuotationAdminViewSet
from suppliers.admin_api import PurchaseOrderViewSet, SupplierViewSet

router = SimpleRouter()
router.register("products", ProductAdminViewSet, basename="manage-product")
router.register("categories", CategoryAdminViewSet, basename="manage-category")
router.register("brands", BrandAdminViewSet, basename="manage-brand")
router.register("reviews", ReviewAdminViewSet, basename="manage-review")
router.register("customers", CustomerAdminViewSet, basename="manage-customer")
router.register("customer-groups", CustomerGroupViewSet, basename="manage-customer-group")
router.register("staff", StaffViewSet, basename="manage-staff")
router.register("orders", OrderAdminViewSet, basename="manage-order")
router.register("inventory", InventoryViewSet, basename="manage-inventory")
router.register("inventory-transactions", TransactionViewSet, basename="manage-inventory-tx")
router.register("warehouses", WarehouseViewSet, basename="manage-warehouse")
router.register("suppliers", SupplierViewSet, basename="manage-supplier")
router.register("purchase-orders", PurchaseOrderViewSet, basename="manage-purchase-order")
router.register("quotations", QuotationAdminViewSet, basename="manage-quotation")
router.register("promotions", PromotionViewSet, basename="manage-promotion")

urlpatterns = [
    path("dashboard/", common_admin.dashboard, name="manage-dashboard"),
    path("site-config/", common_admin.site_config_admin, name="manage-site-config"),
    path("audit-log/", common_admin.audit_log, name="manage-audit-log"),
] + router.urls
