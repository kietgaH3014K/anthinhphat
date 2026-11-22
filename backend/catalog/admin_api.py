from rest_framework import serializers, viewsets

from accounts.permissions import ALL_STAFF, MANAGER_UP, StaffReadWrite
from common.mixins import SafeDeleteMixin
from common.pagination import AdminPagination

from .models import Brand, Category, Product, Review
from .serializers import ProductAdminSerializer


class CategoryAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "sort_order", "is_active"]
        extra_kwargs = {"slug": {"required": False}}


class BrandAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "is_active"]
        extra_kwargs = {"slug": {"required": False}}


class ReviewAdminSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product_name", "user_email", "rating", "comment", "is_approved", "created_at"]
        read_only_fields = ["product_name", "user_email", "rating", "comment", "created_at"]


class _Base(SafeDeleteMixin, viewsets.ModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = MANAGER_UP
    pagination_class = AdminPagination


class ProductAdminViewSet(_Base):
    serializer_class = ProductAdminSerializer
    search_fields = ["name", "sku"]
    filterset_fields = ["category", "brand", "status"]
    ordering_fields = ["created_at", "retail_price", "name", "stock"]

    def get_queryset(self):
        return Product.objects.with_stock().select_related("category", "brand").prefetch_related("images")


class CategoryAdminViewSet(_Base):
    queryset = Category.objects.all()
    serializer_class = CategoryAdminSerializer
    search_fields = ["name"]


class BrandAdminViewSet(_Base):
    queryset = Brand.objects.all()
    serializer_class = BrandAdminSerializer
    search_fields = ["name"]


class ReviewAdminViewSet(_Base):
    queryset = Review.objects.select_related("product", "user")
    serializer_class = ReviewAdminSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]
