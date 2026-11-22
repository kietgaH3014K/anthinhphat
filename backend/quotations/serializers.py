import json
from datetime import date

from django.db import transaction
from rest_framework import serializers

from catalog.models import Product
from common.text import new_code

from .models import Quotation, QuotationItem

PHONE = r"^(0|\+84)\d{9}$"


class QuoteItemInput(serializers.Serializer):
    product_name = serializers.CharField(max_length=255)
    qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    unit = serializers.CharField(max_length=30)


class QuoteCreateSerializer(serializers.Serializer):
    items = QuoteItemInput(many=True, allow_empty=False)
    contact_name = serializers.CharField(max_length=150)
    phone = serializers.RegexField(PHONE, error_messages={"invalid": "Số điện thoại không hợp lệ."})
    email = serializers.EmailField()
    company = serializers.CharField(max_length=200, required=False, allow_blank=True)
    site_address = serializers.CharField(max_length=255)
    desired_date = serializers.DateField()
    note = serializers.CharField(max_length=2000, required=False, allow_blank=True)

    def validate_desired_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Ngày giao không thể ở quá khứ.")
        return value

    @transaction.atomic
    def create(self, validated, user=None, attachment=None):
        items = validated.pop("items")
        quote = Quotation.objects.create(
            code=new_code("BG"), user=user if getattr(user, "is_authenticated", False) else None,
            attachment=attachment, attachment_name=(attachment.name[:200] if attachment else ""), **validated,
        )
        by_name = {p.name.lower(): p for p in Product.objects.filter(name__in=[i["product_name"] for i in items])}
        QuotationItem.objects.bulk_create([
            QuotationItem(quotation=quote, product=by_name.get(i["product_name"].lower()), product_name=i["product_name"], unit=i["unit"], quantity=i["qty"])
            for i in items
        ])
        return quote


def parse_payload(request):
    """Form gửi multipart: trường `data` là JSON, kèm file `attachment` (tùy chọn). Cũng nhận JSON thuần."""
    raw = request.data.get("data")
    if raw is None:
        return {k: v for k, v in request.data.items()} if not hasattr(request.data, "getlist") else request.data.dict()
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        raise serializers.ValidationError({"data": "Dữ liệu không hợp lệ."})


class QuoteItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    line_total = serializers.DecimalField(max_digits=16, decimal_places=0, read_only=True)

    class Meta:
        model = QuotationItem
        fields = ["id", "product", "product_name", "unit", "quantity", "unit_price", "line_total"]
        extra_kwargs = {"product": {"required": False, "allow_null": True}}


class QuotationSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, required=False)
    totals = serializers.SerializerMethodField()
    has_attachment = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            "code", "status", "contact_name", "phone", "email", "company", "site_address", "desired_date", "note",
            "attachment_name", "has_attachment", "discount_percent", "shipping_fee", "valid_until", "staff_note",
            "items", "totals", "created_at", "sent_at",
        ]
        read_only_fields = ["code", "contact_name", "phone", "email", "company", "site_address", "desired_date", "note", "attachment_name", "created_at", "sent_at"]

    def get_totals(self, obj):
        return obj.totals()

    def get_has_attachment(self, obj):
        return bool(obj.attachment)

    def validate_discount_percent(self, v):
        if not 0 <= v <= 100:
            raise serializers.ValidationError("Chiết khấu phải từ 0 đến 100%.")
        return v

    @transaction.atomic
    def update(self, instance, validated):
        items = validated.pop("items", None)
        for key, value in validated.items():
            setattr(instance, key, value)
        if instance.status == Quotation.RECEIVED and items is not None:
            instance.status = Quotation.QUOTING
        instance.save()
        if items is not None:
            keep = []
            for data in items:
                data = dict(data)
                item_id = data.pop("id", None)
                if item_id and instance.items.filter(pk=item_id).exists():
                    QuotationItem.objects.filter(pk=item_id, quotation=instance).update(**{k: v for k, v in data.items() if k != "product"})
                    keep.append(item_id)
                else:
                    keep.append(QuotationItem.objects.create(quotation=instance, **data).pk)
            instance.items.exclude(pk__in=keep).delete()
        return instance
