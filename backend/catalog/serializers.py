from rest_framework import serializers

from accounts.permissions import can_view_wholesale_price
from accounts.models import Role

from .models import Brand, Category, Product, ProductImage, Review
from .pricing import wholesale_price_for


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "slug", "name", "parent"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "slug", "name"]


class ProductSerializer(serializers.ModelSerializer):
    """Dữ liệu công khai. Giá sỉ CHỈ được thêm vào khi người xem đủ quyền (quyết định tại backend)."""

    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    brand = serializers.SerializerMethodField()
    stock = serializers.IntegerField(read_only=True, default=0)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "slug", "sku", "name", "category", "brand", "origin", "spec", "unit", "description", "specs",
            "retail_price", "compare_at_price", "stock", "status", "image",
            "is_featured", "is_best_seller", "is_new", "on_sale", "meta_title", "meta_description",
        ]

    def get_brand(self, obj):
        return obj.brand.name if obj.brand_id else ""

    def get_image(self, obj):
        images = list(obj.images.all())
        if not images:
            return None
        primary = next((i for i in images if i.is_primary), images[0])
        request = self.context.get("request")
        return request.build_absolute_uri(primary.image.url) if request else primary.image.url

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if can_view_wholesale_price(user):
            ws = wholesale_price_for(instance, user)
            if ws is not None:
                data["wholesale_price"] = ws
                data["min_wholesale_qty"] = instance.min_wholesale_qty
        return data


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary"]


class ProductAdminSerializer(serializers.ModelSerializer):
    stock = serializers.IntegerField(read_only=True, default=0)
    images = ProductImageSerializer(many=True, read_only=True)
    image_upload = serializers.ImageField(write_only=True, required=False)
    specs_text = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Product
        exclude = ["search_text"]
        extra_kwargs = {"slug": {"required": False}}

    def validate_image_upload(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Ảnh tối đa 5 MB.")
        fmt = getattr(getattr(value, "image", None), "format", None)
        if fmt not in {"JPEG", "PNG", "WEBP"}:
            raise serializers.ValidationError("Chỉ nhận ảnh JPG, PNG hoặc WebP.")
        return value

    def validate(self, attrs):
        text = attrs.pop("specs_text", None)
        if text is not None:
            specs = {}
            for line in text.splitlines():
                if ":" in line:
                    key, value = line.split(":", 1)
                    if key.strip():
                        specs[key.strip()] = value.strip()
            attrs["specs"] = specs
        ws, retail = attrs.get("wholesale_price"), attrs.get("retail_price")
        if ws is not None and retail is not None and ws > retail:
            raise serializers.ValidationError({"wholesale_price": "Giá sỉ không được cao hơn giá lẻ."})
        return attrs

    def _save_image(self, product, image):
        if image:
            product.images.update(is_primary=False)
            ProductImage.objects.create(product=product, image=image, alt_text=product.name, is_primary=True)

    def create(self, validated):
        image = validated.pop("image_upload", None)
        product = super().create(validated)
        self._save_image(product, image)
        return product

    def update(self, instance, validated):
        image = validated.pop("image_upload", None)
        product = super().update(instance, validated)
        self._save_image(product, image)
        return product

    def to_representation(self, instance):
        data = super().to_representation(instance)
        user = getattr(self.context.get("request"), "user", None)
        if getattr(user, "role", None) == Role.SALES:  # nhân viên bán hàng không xem giá vốn
            data.pop("cost_price", None)
        return data


class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "rating", "comment", "author", "created_at"]
        read_only_fields = ["id", "author", "created_at"]

    def get_author(self, obj):
        name = obj.user.first_name or obj.user.email.split("@")[0]
        return name
