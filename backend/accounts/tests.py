from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Role, User, WholesaleStatus
from .permissions import can_view_wholesale_price

PASSWORD = "Matkhau@12345"


def make_user(email, role=Role.CUSTOMER, status=WholesaleStatus.NONE):
    user = User.objects.create_user(username=email, email=email, password=PASSWORD, role=role)
    user.profile.wholesale_status = status
    user.profile.save()
    return user


class WholesalePriceAccessTests(TestCase):
    def test_anonymous_cannot_view(self):
        self.assertFalse(can_view_wholesale_price(AnonymousUser()))

    def test_retail_customer_cannot_view(self):
        self.assertFalse(can_view_wholesale_price(make_user("le@example.com")))

    def test_pending_wholesale_cannot_view(self):
        self.assertFalse(can_view_wholesale_price(make_user("cho@example.com", status=WholesaleStatus.PENDING)))

    def test_rejected_wholesale_cannot_view(self):
        self.assertFalse(can_view_wholesale_price(make_user("tuchoi@example.com", status=WholesaleStatus.REJECTED)))

    def test_approved_wholesale_can_view(self):
        self.assertTrue(can_view_wholesale_price(make_user("si@example.com", status=WholesaleStatus.APPROVED)))

    def test_sales_staff_can_view(self):
        self.assertTrue(can_view_wholesale_price(make_user("ban@example.com", role=Role.SALES)))

    def test_warehouse_staff_cannot_view(self):
        self.assertFalse(can_view_wholesale_price(make_user("kho@example.com", role=Role.WAREHOUSE)))


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user("khach@example.com")

    def test_profile_created_automatically(self):
        self.assertEqual(self.user.profile.wholesale_status, WholesaleStatus.NONE)

    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get(reverse("me")).status_code, 401)

    def test_login_then_me(self):
        res = self.client.post(reverse("token_obtain"), {"email": "khach@example.com", "password": PASSWORD})
        self.assertEqual(res.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + res.data["access"])
        me = self.client.get(reverse("me"))
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["email"], "khach@example.com")

    def test_wrong_password_rejected(self):
        res = self.client.post(reverse("token_obtain"), {"email": "khach@example.com", "password": "sai"})
        self.assertEqual(res.status_code, 401)


class RegisterApiTests(TestCase):
    def setUp(self):
        cache.clear()  # tránh dính giới hạn tần suất giữa các test
        self.client = APIClient()
        self.base = {"email": "moi@example.com", "password": "Matkhau@12345", "full_name": "Nguyễn Văn A", "phone": "0901234567"}

    def test_register_personal(self):
        res = self.client.post(reverse("register"), self.base)
        self.assertEqual(res.status_code, 201)
        user = User.objects.get(email="moi@example.com")
        self.assertEqual(user.role, Role.CUSTOMER)
        self.assertEqual(user.profile.wholesale_status, WholesaleStatus.NONE)

    def test_register_wholesale_is_pending_and_cannot_see_wholesale_price(self):
        data = {**self.base, "account_type": "wholesale", "company_name": "Công ty ABC", "tax_code": "0312345678"}
        self.assertEqual(self.client.post(reverse("register"), data).status_code, 201)
        user = User.objects.get(email="moi@example.com")
        self.assertEqual(user.profile.wholesale_status, WholesaleStatus.PENDING)
        self.assertFalse(can_view_wholesale_price(user))

    def test_wholesale_requires_company_name(self):
        res = self.client.post(reverse("register"), {**self.base, "account_type": "wholesale"})
        self.assertEqual(res.status_code, 400)

    def test_client_cannot_choose_role(self):
        self.client.post(reverse("register"), {**self.base, "role": "super_admin"})
        self.assertEqual(User.objects.get(email="moi@example.com").role, Role.CUSTOMER)

    def test_duplicate_email_rejected(self):
        self.client.post(reverse("register"), self.base)
        self.assertEqual(self.client.post(reverse("register"), self.base).status_code, 400)

    def test_weak_password_rejected(self):
        self.assertEqual(self.client.post(reverse("register"), {**self.base, "password": "12345678"}).status_code, 400)

    def test_invalid_phone_rejected(self):
        self.assertEqual(self.client.post(reverse("register"), {**self.base, "phone": "123"}).status_code, 400)
