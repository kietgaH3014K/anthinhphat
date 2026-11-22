from rest_framework import serializers

from .models import OrderItem, SalesOrder, ShippingAddress

PHONE = r"^(0|\+84)\d{9}$"


class OrderItemInput(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    qty = serializers.IntegerField(min_value=1, max_value=100000)


class AddressInput(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    phone = serializers.RegexField(PHONE, error_messages={"invalid": "Số điện thoại không hợp lệ."})
    address = serializers.CharField(max_length=255)
    district = serializers.CharField(max_length=100)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)


class OrderCreateSerializer(serializers.Serializer):
    """Chỉ nhận product_id và qty. Mọi trường giá do client gửi đều bị bỏ qua."""

    items = OrderItemInput(many=True, allow_empty=False)
    coupon_code = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=30)
    shipping_address = AddressInput()
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)
    payment_method = serializers.ChoiceField(choices=[SalesOrder.COD, SalesOrder.BANK])


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["product_id", "name", "unit", "qty", "unit_price", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    totals = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = ["code", "created_at", "status", "payment_status", "payment_method", "items", "coupon_code", "totals", "shipping_address", "note"]

    def get_totals(self, o):
        return {"subtotal": o.subtotal, "discount": o.discount, "shipping": o.shipping_fee, "total": o.total}

    def get_shipping_address(self, o):
        return {"full_name": o.ship_full_name, "phone": o.ship_phone, "address": o.ship_address, "district": o.ship_district, "city": o.ship_city}


class OrderAdminSerializer(OrderSerializer):
    customer_email = serializers.CharField(source="user.email", read_only=True)
    customer_phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ["customer_email", "customer_phone", "is_wholesale"]


class ShippingAddressSerializer(serializers.ModelSerializer):
    phone = serializers.RegexField(PHONE, error_messages={"invalid": "Số điện thoại không hợp lệ."})

    class Meta:
        model = ShippingAddress
        fields = ["id", "full_name", "phone", "address", "district", "city", "is_default"]
