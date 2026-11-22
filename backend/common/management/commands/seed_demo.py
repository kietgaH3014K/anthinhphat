"""Nạp dữ liệu mẫu để chạy thử: danh mục, thương hiệu, 15 sản phẩm, một kho, tồn kho và mã ATP5.
Không tạo tài khoản nào. Dùng `createsuperuser` rồi đặt vai trò Super Admin."""
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from catalog.models import Brand, Category, Product
from common.models import SiteConfig
from inventory import services
from inventory.models import Inventory, Warehouse
from promotions.models import Promotion

CATEGORIES = [
    "Xi măng", "Sắt thép xây dựng", "Gạch xây dựng", "Cát xây dựng", "Đá xây dựng", "Sơn nước", "Vật liệu chống thấm",
    "Gạch ốp lát", "Thiết bị vệ sinh", "Thiết bị điện", "Thiết bị nước", "Tôn và vật liệu mái", "Thạch cao",
    "Cửa và phụ kiện", "Vật liệu cách nhiệt", "Vật liệu hoàn thiện", "Dụng cụ xây dựng",
]
# sku, tên, danh mục, thương hiệu, quy cách, đơn vị, giá lẻ, giá sỉ, SL sỉ tối thiểu, tồn, cờ, giá gốc
PRODUCTS = [
    ("ATP-0001", "Xi măng Hà Tiên PCB40", "Xi măng", "Hà Tiên", "Bao 50 kg", "bao", 92000, 86000, 20, 1200, "best", None),
    ("ATP-0002", "Xi măng INSEE đa dụng", "Xi măng", "INSEE", "Bao 50 kg", "bao", 95000, 89000, 20, 800, "best", None),
    ("ATP-0003", "Thép cuộn Hòa Phát Φ6 CB240", "Sắt thép xây dựng", "Hòa Phát", "Cuộn, Φ6 mm", "kg", 17500, 16800, 500, 20000, "best", None),
    ("ATP-0004", "Thép thanh vằn Hòa Phát D10 CB300", "Sắt thép xây dựng", "Hòa Phát", "Cây 11,7 m", "cây", 118000, 112000, 100, 1500, "new", None),
    ("ATP-0005", "Gạch ống 8x8x18 nung tuynel", "Gạch xây dựng", "Tuynel", "8 x 8 x 18 cm", "viên", 1350, 1250, 2000, 50000, "sale", 1450),
    ("ATP-0006", "Cát xây tô hạt trung", "Cát xây dựng", "An Thịnh Phát", "Giao theo khối", "m³", 285000, 270000, 10, 300, "", None),
    ("ATP-0007", "Đá 1x2 xanh", "Đá xây dựng", "An Thịnh Phát", "Giao theo khối", "m³", 350000, 335000, 10, 400, "", None),
    ("ATP-0008", "Sơn nội thất Dulux 18 lít", "Sơn nước", "Dulux", "Thùng 18 L", "thùng", 2650000, 2480000, 5, 60, "new sale", 2790000),
    ("ATP-0009", "Sơn ngoại thất Jotun 5 lít", "Sơn nước", "Jotun", "Lon 5 L", "lon", 1250000, 1180000, 5, 80, "", None),
    ("ATP-0010", "Phụ gia chống thấm Sika Latex TH 5 lít", "Vật liệu chống thấm", "Sika", "Can 5 L", "can", 520000, 490000, 10, 120, "sale", 560000),
    ("ATP-0011", "Gạch lát nền Đồng Tâm 60x60", "Gạch ốp lát", "Đồng Tâm", "60 x 60 cm", "m²", 195000, 182000, 50, 900, "new", None),
    ("ATP-0012", "Bồn cầu một khối Toto", "Thiết bị vệ sinh", "Toto", "Bộ 1 khối", "cái", 5900000, 5600000, 3, 15, "best", None),
    ("ATP-0013", "Tôn lạnh Hoa Sen 0,45 mm", "Tôn và vật liệu mái", "Hoa Sen", "Khổ 1,07 m", "m", 78000, 74000, 100, 5000, "", None),
    ("ATP-0014", "Tấm thạch cao Vĩnh Tường 9 mm", "Thạch cao", "Vĩnh Tường", "1,2 x 2,4 m", "tấm", 95000, 88000, 50, 700, "new", None),
    ("ATP-0015", "Ống nhựa PVC Bình Minh Φ90", "Thiết bị nước", "Bình Minh", "Cây 4 m", "cây", 165000, 155000, 20, 250, "", None),
]


class Command(BaseCommand):
    help = "Nạp dữ liệu mẫu (giá và thương hiệu chỉ để minh họa, hãy thay bằng dữ liệu thật trong trang quản trị)."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Cho phép chạy khi DEBUG=False")

    def handle(self, *args, **opts):
        if not settings.DEBUG and not opts["force"]:
            raise CommandError("Từ chối chạy khi DEBUG=False. Thêm --force nếu bạn thật sự muốn nạp dữ liệu mẫu.")
        cats = {name: Category.objects.get_or_create(name=name, defaults={"sort_order": i})[0] for i, name in enumerate(CATEGORIES)}
        warehouse, _ = Warehouse.objects.get_or_create(name="Kho chính", defaults={"address": "TP. Hồ Chí Minh"})
        created = 0
        for sku, name, cat, brand, spec, unit, retail, ws, min_qty, stock, flags, compare in PRODUCTS:
            product, was_created = Product.objects.get_or_create(
                sku=sku,
                defaults=dict(
                    name=name, category=cats[cat], brand=Brand.objects.get_or_create(name=brand)[0], spec=spec, unit=unit, origin="Việt Nam",
                    retail_price=retail, wholesale_price=ws, min_wholesale_qty=min_qty, compare_at_price=compare,
                    cost_price=Decimal(int(ws * 0.9)), is_best_seller="best" in flags, is_new="new" in flags, on_sale="sale" in flags,
                    is_featured=True, specs={"Quy cách": spec, "Đơn vị tính": unit, "Xuất xứ": "Việt Nam", "Thương hiệu": brand},
                    description=f"{name} do AN THỊNH PHÁT cung cấp, giao tại TP. Hồ Chí Minh.",
                ),
            )
            if was_created:
                created += 1
                if not Inventory.objects.filter(product=product).exists():
                    services.receive(product, warehouse, stock, note="Tồn đầu kỳ (dữ liệu mẫu)")
        Promotion.objects.get_or_create(code="ATP5", defaults={"percent": Decimal(5), "description": "Mã minh họa giảm 5%"})
        SiteConfig.get()
        self.stdout.write(self.style.SUCCESS(f"Đã nạp {created} sản phẩm mới, {len(CATEGORIES)} danh mục, mã ATP5."))
