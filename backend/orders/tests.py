from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Role
from common.testing import approved_wholesale, make_product, make_user, make_warehouse
from common.models import SiteConfig
from inventory.models import Inventory
from orders.models import SalesOrder
from promotions.models import Promotion

ADDRESS = {"full_name": "Nguyễn Văn A", "phone": "0901234567", "address": "12 Lê Lợi", "district": "Quận 1", "city": "TP. Hồ Chí Minh"}
URL = "/api/v1/orders/"


def stock(product):
    return sum(Inventory.objects.filter(product=product).values_list("quantity", flat=True))


class OrderBase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user("khach@example.com")
        self.p = make_product(price=100000, ws=90000, min_qty=10, stock=50)
        self.client.force_authenticate(self.user)

    def order(self, qty=2, **extra):
        body = {"items": [{"product_id": self.p.id, "qty": qty}], "shipping_address": ADDRESS, "payment_method": "cod", **extra}
        return self.client.post(URL, body, format="json")


class PlaceOrderTests(OrderBase):
    def test_total_is_computed_by_server(self):
        res = self.order(2)
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["totals"]["subtotal"], 200000)
        self.assertEqual(res.data["totals"]["shipping"], 50000)
        self.assertEqual(res.data["totals"]["total"], 250000)
        self.assertEqual(stock(self.p), 48)

    def test_client_sent_prices_are_ignored(self):
        body = {"items": [{"product_id": self.p.id, "qty": 1, "unit_price": 1, "line_total": 1}], "totals": {"total": 1}, "shipping_address": ADDRESS, "payment_method": "cod"}
        res = self.client.post(URL, body, format="json")
        self.assertEqual(res.data["items"][0]["unit_price"], 100000)

    def test_free_shipping_above_threshold(self):
        SiteConfig.get()
        big = make_product("BIG", "Hàng lớn", price=3_000_000, stock=5)
        res = self.client.post(URL, {"items": [{"product_id": big.id, "qty": 2}], "shipping_address": ADDRESS, "payment_method": "cod"}, format="json")
        self.assertEqual(res.data["totals"]["shipping"], 0)

    def test_retail_customer_never_gets_wholesale_price(self):
        self.assertEqual(self.order(20).data["items"][0]["unit_price"], 100000)

    def test_approved_wholesale_gets_price_only_from_min_qty(self):
        self.client.force_authenticate(approved_wholesale())
        self.assertEqual(self.order(9).data["items"][0]["unit_price"], 100000)
        self.assertEqual(self.order(10).data["items"][0]["unit_price"], 90000)

    def test_duplicate_lines_are_merged(self):
        body = {"items": [{"product_id": self.p.id, "qty": 3}, {"product_id": self.p.id, "qty": 4}], "shipping_address": ADDRESS, "payment_method": "cod"}
        res = self.client.post(URL, body, format="json")
        self.assertEqual(res.data["items"][0]["qty"], 7)

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.order().status_code, 401)

    def test_unknown_product_rejected(self):
        body = {"items": [{"product_id": 99999, "qty": 1}], "shipping_address": ADDRESS, "payment_method": "cod"}
        self.assertEqual(self.client.post(URL, body, format="json").status_code, 400)

    def test_bad_phone_and_empty_items_rejected(self):
        self.assertEqual(self.client.post(URL, {"items": [], "shipping_address": ADDRESS, "payment_method": "cod"}, format="json").status_code, 400)
        bad = {**ADDRESS, "phone": "123"}
        self.assertEqual(self.client.post(URL, {"items": [{"product_id": self.p.id, "qty": 1}], "shipping_address": bad, "payment_method": "cod"}, format="json").status_code, 400)

    def test_customers_only_see_their_own_orders(self):
        code = self.order().data["code"]
        self.client.force_authenticate(make_user("khac@example.com"))
        self.assertEqual(self.client.get(f"{URL}{code}/").status_code, 404)
        self.assertEqual(self.client.get(URL).data["count"], 0)


class StockSafetyTests(OrderBase):
    def test_cannot_oversell(self):
        res = self.order(51)
        self.assertEqual(res.status_code, 400)
        self.assertIn("còn 50", res.data["detail"])
        self.assertEqual(stock(self.p), 50)
        self.assertEqual(SalesOrder.objects.count(), 0)

    def test_last_units_go_to_first_buyer_only(self):
        self.assertEqual(self.order(50).status_code, 201)
        self.client.force_authenticate(make_user("nguoi2@example.com"))
        self.assertEqual(self.order(1).status_code, 400)
        self.assertEqual(stock(self.p), 0)

    def test_failed_order_does_not_consume_coupon(self):
        Promotion.objects.create(code="GIAM10", percent=10)
        self.assertEqual(self.order(51, coupon_code="GIAM10").status_code, 400)
        self.assertEqual(Promotion.objects.get(code="GIAM10").used_count, 0)

    def test_one_bad_line_rolls_back_whole_order(self):
        other = make_product("SP2", "Gạch", stock=1)
        body = {"items": [{"product_id": self.p.id, "qty": 5}, {"product_id": other.id, "qty": 2}], "shipping_address": ADDRESS, "payment_method": "cod"}
        self.assertEqual(self.client.post(URL, body, format="json").status_code, 400)
        self.assertEqual(stock(self.p), 50)


class CouponTests(OrderBase):
    def test_percent_discount(self):
        Promotion.objects.create(code="giam10", percent=10)
        res = self.order(2, coupon_code="GIAM10")
        self.assertEqual(res.data["totals"]["discount"], 20000)
        self.assertEqual(res.data["totals"]["total"], 230000)
        self.assertEqual(Promotion.objects.get(code="GIAM10").used_count, 1)

    def test_invalid_expired_and_exhausted_codes(self):
        Promotion.objects.create(code="HETHAN", percent=10, ends_at=timezone.now() - timedelta(days=1))
        Promotion.objects.create(code="HETLUOT", percent=10, max_uses=1, used_count=1)
        Promotion.objects.create(code="TOITHIEU", percent=10, min_order=1_000_000)
        for code in ("KHONGCO", "HETHAN", "HETLUOT", "TOITHIEU"):
            self.assertEqual(self.order(1, coupon_code=code).status_code, 400, code)
        self.assertEqual(stock(self.p), 50)

    def test_validate_endpoint(self):
        Promotion.objects.create(code="ATP5", percent=5)
        ok = self.client.post("/api/v1/promotions/validate/", {"code": " atp5 "})
        self.assertEqual((ok.status_code, ok.data["percent"]), (200, Decimal("5.00")))
        self.assertEqual(self.client.post("/api/v1/promotions/validate/", {"code": "sai"}).status_code, 400)


class StatusTests(OrderBase):
    def setUp(self):
        super().setUp()
        self.code = self.order(3).data["code"]
        self.staff = APIClient()
        self.staff.force_authenticate(make_user("ban@example.com", role=Role.SALES))

    def set(self, status):
        return self.staff.post(f"/api/v1/manage/orders/{self.code}/set-status/", {"status": status}, format="json")

    def test_customer_can_cancel_pending_and_stock_returns(self):
        res = self.client.post(f"{URL}{self.code}/cancel/")
        self.assertEqual(res.data["status"], "cancelled")
        self.assertEqual(stock(self.p), 50)

    def test_customer_cannot_cancel_after_confirmation(self):
        self.set("confirmed")
        self.assertEqual(self.client.post(f"{URL}{self.code}/cancel/").status_code, 400)

    def test_valid_flow_and_cod_marked_paid_on_completion(self):
        for s in ("confirmed", "shipping", "completed"):
            self.assertEqual(self.set(s).status_code, 200, s)
        self.assertEqual(SalesOrder.objects.get(code=self.code).payment_status, "paid")

    def test_invalid_transitions_rejected(self):
        self.assertEqual(self.set("completed").status_code, 400)
        self.set("cancelled")
        self.assertEqual(self.set("confirmed").status_code, 400)

    def test_staff_cancel_restores_stock_once(self):
        self.set("cancelled")
        self.set("cancelled")
        self.assertEqual(stock(self.p), 50)

    def test_customer_cannot_use_manage_orders(self):
        self.assertEqual(self.client.get("/api/v1/manage/orders/").status_code, 403)

    def test_warehouse_can_read_but_not_change_status(self):
        wh = APIClient()
        wh.force_authenticate(make_user("kho@example.com", role=Role.WAREHOUSE))
        self.assertEqual(wh.get("/api/v1/manage/orders/").status_code, 200)
        self.assertEqual(wh.post(f"/api/v1/manage/orders/{self.code}/set-status/", {"status": "confirmed"}, format="json").status_code, 403)
