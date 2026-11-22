from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import ALL_STAFF, WAREHOUSE_UP, StaffReadWrite
from common.exceptions import BusinessError
from common.mixins import SafeDeleteMixin
from common.pagination import AdminPagination
from common.services import audit
from common.text import new_code
from inventory import services as inventory_services

from .models import PurchaseOrder, PurchaseOrderItem, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_name", "phone", "email", "address", "tax_code", "is_active"]


class POItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "product", "quantity", "unit_cost"]
        extra_kwargs = {"quantity": {"min_value": 1}}


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = POItemSerializer(many=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = ["id", "code", "supplier", "warehouse", "status", "note", "items", "total", "created_at", "received_at"]
        read_only_fields = ["code", "status", "created_at", "received_at"]

    def get_total(self, obj):
        return sum(i.quantity * i.unit_cost for i in obj.items.all())

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Cần ít nhất một sản phẩm.")
        return value

    @transaction.atomic
    def create(self, validated):
        items = validated.pop("items")
        po = PurchaseOrder.objects.create(code=new_code("PN"), created_by=self.context["request"].user, **validated)
        PurchaseOrderItem.objects.bulk_create([PurchaseOrderItem(purchase_order=po, **i) for i in items])
        return po

    @transaction.atomic
    def update(self, instance, validated):
        if instance.status not in (PurchaseOrder.DRAFT, PurchaseOrder.ORDERED):
            raise BusinessError("Đơn nhập đã nhận hoặc đã hủy, không thể sửa.")
        items = validated.pop("items", None)
        for key, value in validated.items():
            setattr(instance, key, value)
        instance.save()
        if items is not None:
            instance.items.all().delete()
            PurchaseOrderItem.objects.bulk_create([PurchaseOrderItem(purchase_order=instance, **i) for i in items])
        return instance


class SupplierViewSet(SafeDeleteMixin, viewsets.ModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = WAREHOUSE_UP
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    pagination_class = AdminPagination
    search_fields = ["name", "phone", "tax_code"]


class PurchaseOrderViewSet(SafeDeleteMixin, viewsets.ModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = WAREHOUSE_UP
    serializer_class = PurchaseOrderSerializer
    pagination_class = AdminPagination
    search_fields = ["code", "supplier__name"]
    filterset_fields = ["status", "supplier"]

    def get_queryset(self):
        return PurchaseOrder.objects.select_related("supplier", "warehouse").prefetch_related("items")

    @action(detail=True, methods=["post"])
    def receive(self, request, pk=None):
        """Nhận hàng: nhập kho từng dòng và cập nhật giá vốn, trong một giao dịch."""
        with transaction.atomic():
            get_object_or_404(PurchaseOrder, pk=pk)
            po = PurchaseOrder.objects.select_for_update().get(pk=pk)
            if po.status not in (PurchaseOrder.DRAFT, PurchaseOrder.ORDERED):
                raise BusinessError("Đơn nhập đã nhận hoặc đã hủy.")
            for item in po.items.select_related("product"):
                inventory_services.receive(item.product, po.warehouse, item.quantity, request.user, item.unit_cost, reference=po.code)
            po.status = PurchaseOrder.RECEIVED
            po.received_at = timezone.now()
            po.save(update_fields=["status", "received_at", "updated_at"])
        audit(request.user, "purchase.receive", po.code)
        return Response(self.get_serializer(po).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        po = self.get_object()
        if po.status == PurchaseOrder.RECEIVED:
            raise BusinessError("Đơn đã nhập kho, không thể hủy.")
        po.status = PurchaseOrder.CANCELLED
        po.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(po).data)
