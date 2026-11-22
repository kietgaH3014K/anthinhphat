from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role, WholesaleStatus
from catalog.models import Category, Product
from common.testing import approved_wholesale, make_product, make_user


class WholesaleVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.p = make_product()

    def fetch(self, user=None):
        self.client.force_authenticate(user)
        return self.client.get(f"/api/v1/products/{self.p.slug}/").data

    def test_anonymous_has_no_wholesale_fields(self):
        data = self.fetch()
        self.assertNotIn("wholesale_price", data)
        self.assertNotIn("min_wholesale_qty", data)

    def test_retail_customer_has_no_wholesale_fields(self):
        self.assertNotIn("wholesale_price", self.fetch(make_user("le@example.com")))

    def test_pending_wholesale_has_no_wholesale_fields(self):
        self.assertNotIn("wholesale_price", self.fetch(make_user("cho@example.com", wholesale=WholesaleStatus.PENDING)))

    def test_list_endpoint_also_hides_wholesale(self):
        results = self.client.get("/api/v1/products/").data["results"]
        self.assertTrue(all("wholesale_price" not in r for r in results))

    def test_approved_wholesale_sees_price(self):
        data = self.fetch(approved_wholesale())
        self.assertEqual(data["wholesale_price"], 90000)
        self.assertEqual(data["min_wholesale_qty"], 10)

    def test_sales_staff_sees_price(self):
        self.assertEqual(self.fetch(make_user("ban@example.com", role=Role.SALES))["wholesale_price"], 90000)

    def test_group_discount_applies(self):
        from accounts.models import CustomerGroup

        user = approved_wholesale()
        user.profile.customer_group = CustomerGroup.objects.create(name="Đại lý cấp 1", discount_percent=10)
        user.profile.save()
        self.assertEqual(self.fetch(user)["wholesale_price"], 81000)


class ProductListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.xm = make_product("XM1", "Xi măng Hà Tiên", price=92000, is_best_seller=True)
        self.thep = make_product("TH1", "Thép cuộn Φ6", price=17500, category="Sắt thép")

    def names(self, query=""):
        return [r["name"] for r in self.client.get(f"/api/v1/products/?{query}").data["results"]]

    def test_search_without_accents(self):
        self.assertEqual(self.names("search=xi mang"), ["Xi măng Hà Tiên"])
        self.assertEqual(self.names("search=thep cuon"), ["Thép cuộn Φ6"])

    def test_filter_by_category_slug(self):
        self.assertEqual(self.names("category=sat-thep"), ["Thép cuộn Φ6"])

    def test_category_includes_children(self):
        parent = Category.objects.get(name="Xi măng")
        child = Category.objects.create(name="Xi măng trắng", parent=parent)
        make_product("XT1", "Xi măng trắng", category="Xi măng trắng")
        child.refresh_from_db()
        self.assertIn("Xi măng trắng", self.names("category=xi-mang"))

    def test_flag_and_price_filters(self):
        self.assertEqual(self.names("best_seller=true"), ["Xi măng Hà Tiên"])
        self.assertEqual(self.names("max_price=20000"), ["Thép cuộn Φ6"])

    def test_ordering(self):
        self.assertEqual(self.names("ordering=price")[0], "Thép cuộn Φ6")
        self.assertEqual(self.names("ordering=-price")[0], "Xi măng Hà Tiên")

    def test_hidden_product_not_listed_or_fetchable(self):
        Product.objects.filter(pk=self.xm.pk).update(status=Product.HIDDEN)
        self.assertNotIn("Xi măng Hà Tiên", self.names())
        self.assertEqual(self.client.get(f"/api/v1/products/{self.xm.slug}/").status_code, 404)

    def test_stock_is_sum_of_warehouses(self):
        self.assertEqual(self.client.get(f"/api/v1/products/{self.xm.slug}/").data["stock"], 100)

    def test_categories_and_brands_are_plain_lists(self):
        self.assertIsInstance(self.client.get("/api/v1/categories/").data, list)
        self.assertIsInstance(self.client.get("/api/v1/brands/").data, list)

    def test_vietnamese_slug(self):
        self.assertEqual(Product.objects.get(sku="XM1").slug, "xi-mang-ha-tien")


class ProductAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name="Xi măng")
        self.payload = {"sku": "NEW1", "name": "Sản phẩm mới", "category": self.cat.id, "unit": "bao", "retail_price": 100000, "wholesale_price": 90000}

    def test_customer_cannot_use_manage_api(self):
        self.client.force_authenticate(make_user("khach@example.com"))
        self.assertEqual(self.client.get("/api/v1/manage/products/").status_code, 403)

    def test_anonymous_gets_401(self):
        self.assertEqual(self.client.get("/api/v1/manage/products/").status_code, 401)

    def test_sales_can_read_but_not_write(self):
        self.client.force_authenticate(make_user("ban@example.com", role=Role.SALES))
        self.assertEqual(self.client.get("/api/v1/manage/products/").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/manage/products/", self.payload).status_code, 403)

    def test_manager_creates_product(self):
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        res = self.client.post("/api/v1/manage/products/", self.payload, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(Product.objects.get(sku="NEW1").slug, "san-pham-moi")

    def test_wholesale_cannot_exceed_retail(self):
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        res = self.client.post("/api/v1/manage/products/", {**self.payload, "wholesale_price": 150000}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_duplicate_sku_rejected(self):
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        self.client.post("/api/v1/manage/products/", self.payload, format="json")
        self.assertEqual(self.client.post("/api/v1/manage/products/", {**self.payload, "name": "Khác"}, format="json").status_code, 400)

    def test_sales_does_not_see_cost_price(self):
        make_product("A1", cost_price=70000)
        self.client.force_authenticate(make_user("ban@example.com", role=Role.SALES))
        self.assertNotIn("cost_price", self.client.get("/api/v1/manage/products/").data["results"][0])

    def test_cannot_delete_product_in_orders(self):
        from orders.models import OrderItem, SalesOrder

        user = make_user("khach@example.com")
        product = make_product("A2")
        order = SalesOrder.objects.create(code="X", user=user, payment_method="cod", subtotal=1, total=1, ship_full_name="a", ship_phone="0", ship_address="a", ship_district="a", ship_city="a")
        OrderItem.objects.create(order=order, product=product, name="a", unit="b", qty=1, unit_price=1, line_total=1)
        self.client.force_authenticate(make_user("ql@example.com", role=Role.MANAGER))
        res = self.client.delete(f"/api/v1/manage/products/{product.id}/")
        self.assertEqual(res.status_code, 400)
