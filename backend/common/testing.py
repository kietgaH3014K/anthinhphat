"""Hàm dựng dữ liệu dùng chung cho các bộ kiểm thử."""
from accounts.models import Role, User, WholesaleStatus
from catalog.models import Brand, Category, Product
from inventory import services
from inventory.models import Warehouse

PASSWORD = "Matkhau@12345"


def make_user(email, role=Role.CUSTOMER, wholesale=None, **extra):
    user = User.objects.create_user(username=email, email=email, password=PASSWORD, role=role, **extra)
    if wholesale:
        user.profile.wholesale_status = wholesale
        user.profile.save()
    return user


def approved_wholesale(email="si@example.com"):
    return make_user(email, wholesale=WholesaleStatus.APPROVED)


def make_warehouse(name="Kho 1"):
    return Warehouse.objects.get_or_create(name=name)[0]


def make_product(sku="SP1", name="Xi măng A", price=100000, ws=90000, min_qty=10, stock=100, category="Xi măng", **extra):
    cat = Category.objects.get_or_create(name=category)[0]
    product = Product.objects.create(
        sku=sku, name=name, category=cat, brand=Brand.objects.get_or_create(name="Hà Tiên")[0], unit="bao",
        retail_price=price, wholesale_price=ws, min_wholesale_qty=min_qty, **extra,
    )
    if stock:
        services.receive(product, make_warehouse(), stock)
    return product
