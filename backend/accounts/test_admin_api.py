from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CustomerGroup, Role, User, WholesaleStatus
from accounts.permissions import can_view_wholesale_price
from common.models import SiteConfig
from common.testing import make_product, make_user


class WholesaleApprovalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = make_user("si@example.com", wholesale=WholesaleStatus.PENDING)
        self.group = CustomerGroup.objects.create(name="Đại lý", discount_percent=5)
        self.url = f"/api/v1/manage/customers/{self.customer.id}/"

    def test_manager_approves_and_customer_then_sees_wholesale(self):
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        res = self.client.post(self.url + "approve/", {"customer_group": self.group.id})
        self.assertEqual(res.status_code, 200, res.data)
        user = User.objects.get(pk=self.customer.pk)
        self.assertTrue(can_view_wholesale_price(user))
        self.assertEqual(user.profile.customer_group, self.group)
        self.assertEqual(user.profile.approved_by.email, "ql@example.com")

    def test_rejected_customer_still_cannot_see_wholesale(self):
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        self.client.post(self.url + "reject/")
        self.assertFalse(can_view_wholesale_price(User.objects.get(pk=self.customer.pk)))

    def test_cannot_decide_twice(self):
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        self.client.post(self.url + "approve/")
        self.assertEqual(self.client.post(self.url + "reject/").status_code, 400)

    def test_sales_staff_cannot_approve(self):
        self.client.force_authenticate(make_user("ban@example.com", role=Role.SALES))
        self.assertEqual(self.client.post(self.url + "approve/").status_code, 403)

    def test_warehouse_cannot_list_customers(self):
        self.client.force_authenticate(make_user("kho@example.com", role=Role.WAREHOUSE))
        self.assertEqual(self.client.get("/api/v1/manage/customers/").status_code, 403)

    def test_customer_cannot_approve_themselves(self):
        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.post(self.url + "approve/").status_code, 403)
        self.assertFalse(can_view_wholesale_price(User.objects.get(pk=self.customer.pk)))

    def test_audit_log_written(self):
        from common.models import AuditLog

        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        self.client.post(self.url + "approve/")
        self.assertTrue(AuditLog.objects.filter(action="wholesale.approved", target="si@example.com").exists())


class StaffAndConfigTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_only_super_admin_manages_staff(self):
        body = {"email": "moi@example.com", "full_name": "Nhân viên mới", "role": "sales", "password": "Matkhau@12345", "is_active": True}
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        self.assertEqual(self.client.post("/api/v1/manage/staff/", body, format="json").status_code, 403)
        self.client.force_authenticate(make_user("sa@example.com", role=Role.SUPER_ADMIN))
        res = self.client.post("/api/v1/manage/staff/", body, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(User.objects.get(email="moi@example.com").role, Role.SALES)

    def test_staff_endpoint_cannot_create_customer_role(self):
        self.client.force_authenticate(make_user("sa@example.com", role=Role.SUPER_ADMIN))
        body = {"email": "x@example.com", "full_name": "X", "role": "customer", "password": "Matkhau@12345"}
        self.assertEqual(self.client.post("/api/v1/manage/staff/", body, format="json").status_code, 400)

    def test_site_config_public_read_manager_write(self):
        self.assertEqual(self.client.get("/api/v1/site-config/").status_code, 200)
        self.client.force_authenticate(make_user("ban@example.com", role=Role.SALES))
        self.assertEqual(self.client.patch("/api/v1/manage/site-config/", {"hotline": "0900000000"}, format="json").status_code, 403)
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        self.assertEqual(self.client.patch("/api/v1/manage/site-config/", {"hotline": "0900000000"}, format="json").status_code, 200)
        self.assertEqual(SiteConfig.get().hotline, "0900000000")

    def test_dashboard_access_and_shape(self):
        self.client.force_authenticate(make_user("ban@example.com", role=Role.SALES))
        self.assertEqual(self.client.get("/api/v1/manage/dashboard/").status_code, 403)
        make_product(stock=3)
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        res = self.client.get("/api/v1/manage/dashboard/")
        self.assertEqual(res.status_code, 200)
        for key in ("total_revenue", "total_orders", "open_orders", "customers", "products", "inventory_value", "revenue_by_day", "best_sellers", "new_orders", "low_stock"):
            self.assertIn(key, res.data)

    def test_sitemap_and_robots(self):
        make_product()
        self.assertIn("xi-mang-a", self.client.get("/sitemap.xml").content.decode())
        self.assertIn("Sitemap:", self.client.get("/robots.txt").content.decode())
