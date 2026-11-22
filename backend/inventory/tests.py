from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from common.exceptions import BusinessError
from common.testing import make_product, make_user, make_warehouse
from inventory import services
from inventory.models import Inventory, InventoryTransaction, Warehouse
from inventory.services import InsufficientStock


def qty(product, warehouse):
    return Inventory.objects.get(product=product, warehouse=warehouse).quantity


class StockServiceTests(TestCase):
    def setUp(self):
        self.wh = make_warehouse()
        self.p = make_product(stock=0, cost_price=0)

    def test_receive_increases_stock_and_logs(self):
        tx = services.receive(self.p, self.wh, 50)
        self.assertEqual(qty(self.p, self.wh), 50)
        self.assertEqual((tx.kind, tx.quantity_change, tx.balance_after), ("in", 50, 50))

    def test_weighted_average_cost(self):
        services.receive(self.p, self.wh, 100, unit_cost=80000)
        services.receive(self.p, self.wh, 100, unit_cost=100000)
        self.p.refresh_from_db()
        self.assertEqual(self.p.cost_price, 90000)

    def test_receive_rejects_non_positive(self):
        with self.assertRaises(BusinessError):
            services.receive(self.p, self.wh, 0)

    def test_issue_decreases_and_blocks_negative(self):
        services.receive(self.p, self.wh, 10)
        services.issue(self.p, self.wh, 4)
        self.assertEqual(qty(self.p, self.wh), 6)
        with self.assertRaises(InsufficientStock):
            services.issue(self.p, self.wh, 7)
        self.assertEqual(qty(self.p, self.wh), 6)

    def test_adjust_records_difference(self):
        services.receive(self.p, self.wh, 10)
        tx = services.adjust(self.p, self.wh, 7, note="Kiểm kê", kind="stocktake")
        self.assertEqual((tx.quantity_change, tx.kind), (-3, "stocktake"))
        self.assertIsNone(services.adjust(self.p, self.wh, 7))

    def test_allocate_sale_spans_warehouses(self):
        wh2 = Warehouse.objects.create(name="Kho 2")
        services.receive(self.p, self.wh, 5)
        services.receive(self.p, wh2, 8)
        services.allocate_sale(self.p, 10, "REF1")
        self.assertEqual(qty(self.p, wh2) + qty(self.p, self.wh), 3)
        self.assertEqual(InventoryTransaction.objects.filter(reference="REF1", kind="sale").count(), 2)

    def test_allocate_sale_all_or_nothing(self):
        services.receive(self.p, self.wh, 5)
        with self.assertRaises(InsufficientStock):
            services.allocate_sale(self.p, 6, "REF2")
        self.assertEqual(qty(self.p, self.wh), 5)

    def test_inactive_warehouse_not_sold_from(self):
        services.receive(self.p, self.wh, 5)
        Warehouse.objects.filter(pk=self.wh.pk).update(is_active=False)
        with self.assertRaises(InsufficientStock):
            services.allocate_sale(self.p, 1, "REF3")

    def test_restore_sale_is_idempotent(self):
        services.receive(self.p, self.wh, 5)
        services.allocate_sale(self.p, 3, "REF4")
        services.restore_sale("REF4")
        services.restore_sale("REF4")
        self.assertEqual(qty(self.p, self.wh), 5)

    def test_database_blocks_negative_quantity(self):
        from django.db import IntegrityError, transaction

        row = Inventory.objects.create(product=self.p, warehouse=self.wh, quantity=1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Inventory.objects.filter(pk=row.pk).update(quantity=-1)


class InventoryApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.wh = make_warehouse()
        self.p = make_product(stock=0)
        self.body = {"product": self.p.id, "warehouse": self.wh.id, "quantity": 20}

    def test_warehouse_staff_can_receive(self):
        self.client.force_authenticate(make_user("kho@example.com", role=Role.WAREHOUSE))
        self.assertEqual(self.client.post("/api/v1/manage/inventory/receive/", {**self.body, "unit_cost": 85000}).status_code, 201)
        self.assertEqual(qty(self.p, self.wh), 20)

    def test_sales_staff_cannot_change_stock(self):
        self.client.force_authenticate(make_user("ban@example.com", role=Role.SALES))
        self.assertEqual(self.client.post("/api/v1/manage/inventory/receive/", self.body).status_code, 403)

    def test_issue_more_than_available_is_400(self):
        self.client.force_authenticate(make_user("kho@example.com", role=Role.WAREHOUSE))
        res = self.client.post("/api/v1/manage/inventory/issue/", self.body)
        self.assertEqual(res.status_code, 400)
        self.assertIn("còn", res.data["detail"])

    def test_adjust_requires_reason(self):
        self.client.force_authenticate(make_user("kho@example.com", role=Role.WAREHOUSE))
        self.assertEqual(self.client.post("/api/v1/manage/inventory/adjust/", self.body).status_code, 400)
        self.assertEqual(self.client.post("/api/v1/manage/inventory/adjust/", {**self.body, "note": "Kiểm kê cuối tháng"}).status_code, 201)

    def test_low_stock_lists_products_at_or_below_threshold(self):
        services.receive(self.p, self.wh, 5)  # ngưỡng mặc định 10
        self.client.force_authenticate(make_user("kho@example.com", role=Role.WAREHOUSE))
        names = [r["name"] for r in self.client.get("/api/v1/manage/inventory/low-stock/").data]
        self.assertIn(self.p.name, names)
