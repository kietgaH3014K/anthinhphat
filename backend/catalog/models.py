from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Sum
from django.db.models.functions import Coalesce

from accounts.models import CustomerGroup
from common.models import TimeStampedModel
from common.text import make_slug, normalize


def unique_slug(model, value, instance):
    base = make_slug(value)
    slug, i = base, 2
    while model.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
        slug = f"{base}-{i}"
        i += 1
    return slug


class Category(TimeStampedModel):
    name = models.CharField("Tên danh mục", max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="children")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "Danh mục"
        verbose_name_plural = "Danh mục"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Category, self.name, self)
        super().save(*args, **kwargs)

    def descendant_ids(self):
        ids, frontier = [self.pk], [self.pk]
        while frontier:
            frontier = list(Category.objects.filter(parent_id__in=frontier).values_list("pk", flat=True))
            ids.extend(frontier)
        return ids


class Brand(TimeStampedModel):
    name = models.CharField("Thương hiệu", max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Thương hiệu"
        verbose_name_plural = "Thương hiệu"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Brand, self.name, self)
        super().save(*args, **kwargs)


class ProductQuerySet(models.QuerySet):
    def with_stock(self):
        """Tồn kho = tổng số lượng ở mọi kho."""
        return self.annotate(stock=Coalesce(Sum("inventory_rows__quantity"), 0))


class Product(TimeStampedModel):
    ACTIVE, HIDDEN = "active", "hidden"
    STATUS = [(ACTIVE, "Đang kinh doanh"), (HIDDEN, "Ngừng kinh doanh")]

    sku = models.CharField("SKU", max_length=40, unique=True)
    name = models.CharField("Tên sản phẩm", max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    brand = models.ForeignKey(Brand, null=True, blank=True, on_delete=models.PROTECT, related_name="products")
    origin = models.CharField("Xuất xứ", max_length=100, blank=True)
    spec = models.CharField("Quy cách", max_length=150, blank=True)
    unit = models.CharField("Đơn vị tính", max_length=30)
    description = models.TextField("Mô tả", blank=True)
    specs = models.JSONField("Thông số kỹ thuật", default=dict, blank=True)

    retail_price = models.DecimalField("Giá bán lẻ", max_digits=14, decimal_places=0, validators=[MinValueValidator(0)])
    wholesale_price = models.DecimalField("Giá bán sỉ", max_digits=14, decimal_places=0, null=True, blank=True, validators=[MinValueValidator(0)])
    min_wholesale_qty = models.PositiveIntegerField("Số lượng tối thiểu mua sỉ", default=1)
    compare_at_price = models.DecimalField("Giá gốc (gạch ngang)", max_digits=14, decimal_places=0, null=True, blank=True)
    cost_price = models.DecimalField("Giá vốn", max_digits=14, decimal_places=0, default=0)
    low_stock_threshold = models.PositiveIntegerField("Ngưỡng cảnh báo sắp hết", default=10)

    status = models.CharField(max_length=10, choices=STATUS, default=ACTIVE, db_index=True)
    is_featured = models.BooleanField("Nổi bật", default=False)
    is_best_seller = models.BooleanField("Bán chạy", default=False)
    is_new = models.BooleanField("Mới", default=False)
    on_sale = models.BooleanField("Khuyến mãi", default=False)

    meta_title = models.CharField(max_length=160, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)
    search_text = models.TextField(editable=False, blank=True)

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "Sản phẩm"
        verbose_name_plural = "Sản phẩm"
        indexes = [models.Index(fields=["status", "category"]), models.Index(fields=["retail_price"])]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Product, self.name, self)
        self.search_text = normalize(f"{self.name} {self.sku} {self.brand.name if self.brand_id else ''}")
        super().save(*args, **kwargs)


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/%Y/%m/")
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-is_primary", "sort_order", "id"]


class ProductPrice(TimeStampedModel):
    """Giá sỉ riêng cho một nhóm khách (ghi đè giá sỉ chung và chiết khấu nhóm)."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="group_prices")
    customer_group = models.ForeignKey(CustomerGroup, on_delete=models.CASCADE, related_name="product_prices")
    price = models.DecimalField(max_digits=14, decimal_places=0)

    class Meta:
        unique_together = [("product", "customer_group")]


class Review(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, max_length=1000)
    is_approved = models.BooleanField(default=True)

    class Meta:
        unique_together = [("product", "user")]
        ordering = ["-created_at"]
