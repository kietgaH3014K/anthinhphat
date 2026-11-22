import json
from datetime import date, timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from common.testing import make_user
from quotations.models import Quotation

PDF = b"%PDF-1.4\n%test\n"
XLSX = b"PK\x03\x04" + b"0" * 30


def payload(**extra):
    base = {
        "items": [{"product_name": "Xi măng Hà Tiên", "qty": "10", "unit": "bao"}, {"product_name": "Cát xây tô", "qty": "2.5", "unit": "m³"}],
        "contact_name": "Trần Văn B", "phone": "0912345678", "email": "b@example.com", "company": "Công ty ABC",
        "site_address": "Công trình Thủ Đức", "desired_date": (date.today() + timedelta(days=5)).isoformat(),
    }
    return {**base, **extra}


class QuoteSubmitTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def post(self, data=None, file=None):
        body = {"data": json.dumps(data or payload())}
        if file:
            body["attachment"] = file
        return self.client.post("/api/v1/quotations/", body, format="multipart")

    def tearDown(self):
        for q in Quotation.objects.exclude(attachment=""):
            q.attachment.delete(save=False)

    def test_guest_can_submit_without_file(self):
        res = self.post()
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data["code"].startswith("BG-"))
        self.assertEqual(Quotation.objects.get().items.count(), 2)

    def test_valid_pdf_and_xlsx_accepted(self):
        self.assertEqual(self.post(file=SimpleUploadedFile("bang.pdf", PDF)).status_code, 201)
        self.assertEqual(self.post(file=SimpleUploadedFile("bang.xlsx", XLSX)).status_code, 201)

    def test_wrong_extension_rejected(self):
        self.assertEqual(self.post(file=SimpleUploadedFile("virus.exe", b"MZ....")).status_code, 400)

    def test_fake_pdf_rejected_by_content(self):
        self.assertEqual(self.post(file=SimpleUploadedFile("gia.pdf", b"<html>not a pdf</html>")).status_code, 400)

    def test_oversized_file_rejected(self):
        self.assertEqual(self.post(file=SimpleUploadedFile("lon.pdf", b"%PDF" + b"0" * (10 * 1024 * 1024 + 1))).status_code, 400)

    def test_validation_errors(self):
        self.assertEqual(self.post(payload(items=[])).status_code, 400)
        self.assertEqual(self.post(payload(phone="12")).status_code, 400)
        self.assertEqual(self.post(payload(desired_date=(date.today() - timedelta(days=1)).isoformat())).status_code, 400)

    def test_attachment_not_exposed_in_media_urls(self):
        self.post(file=SimpleUploadedFile("bang.pdf", PDF))
        quote = Quotation.objects.get()
        self.assertIn("private_media", quote.attachment.path)


class QuoteStaffTests(TestCase):
    def setUp(self):
        self.guest = APIClient()
        self.code = self.guest.post("/api/v1/quotations/", {"data": json.dumps(payload())}, format="multipart").data["code"]
        self.sales = APIClient()
        self.sales.force_authenticate(make_user("ban@example.com", role=Role.SALES))
        self.url = f"/api/v1/manage/quotations/{self.code}/"
        self.items = list(Quotation.objects.get(code=self.code).items.order_by("id"))

    def price_all(self):
        return self.sales.patch(self.url, {"discount_percent": "5", "shipping_fee": 100000, "items": [{"id": self.items[0].id, "unit_price": 95000}, {"id": self.items[1].id, "unit_price": 300000}]}, format="json")

    def test_public_and_customers_cannot_open_manage_api(self):
        self.assertEqual(self.guest.get(self.url).status_code, 401)
        customer = APIClient()
        customer.force_authenticate(make_user("khach@example.com"))
        self.assertEqual(customer.get(self.url).status_code, 403)

    def test_staff_prices_items_and_totals(self):
        res = self.price_all()
        self.assertEqual(res.status_code, 200, res.data)
        t = res.data["totals"]
        self.assertEqual((t["subtotal"], t["discount"], t["total"]), (1_700_000, 85_000, 1_715_000))
        self.assertEqual(res.data["status"], "quoting")

    def test_cannot_send_until_every_item_has_a_price(self):
        self.assertEqual(self.sales.post(self.url + "send/").status_code, 400)
        self.price_all()
        res = self.sales.post(self.url + "send/")
        self.assertEqual((res.status_code, res.data["status"]), (200, "sent"))

    def test_pdf_export(self):
        self.price_all()
        res = self.sales.get(self.url + "pdf/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF"))

    def test_pdf_handles_unpriced_items(self):
        self.assertEqual(self.sales.get(self.url + "pdf/").status_code, 200)

    def test_attachment_download_staff_only(self):
        res = self.guest.post("/api/v1/quotations/", {"data": json.dumps(payload()), "attachment": SimpleUploadedFile("b.pdf", PDF)}, format="multipart")
        quote = Quotation.objects.get(code=res.data["code"])
        try:
            self.assertEqual(self.guest.get(f"/api/v1/manage/quotations/{quote.code}/attachment/").status_code, 401)
            self.assertEqual(self.sales.get(f"/api/v1/manage/quotations/{quote.code}/attachment/").status_code, 200)
        finally:
            quote.attachment.delete(save=False)

    def test_customer_cannot_download_unsent_pdf(self):
        owner = make_user("chu@example.com")
        Quotation.objects.filter(code=self.code).update(user=owner)
        client = APIClient()
        client.force_authenticate(owner)
        self.assertEqual(client.get(f"/api/v1/quotations/{self.code}/pdf/").status_code, 400)
