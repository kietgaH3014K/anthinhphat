from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import ALL_STAFF, MANAGER_UP, WAREHOUSE_UP, StaffReadWrite
from catalog.models import Product
from common.exceptions import BusinessError
from common.mixins import SafeDeleteMixin
from common.pagination import AdminPagination
from common.services import audit

from . import services
from .models import Inventory, InventoryTransaction, Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "address", "is_active"]


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)
    unit = serializers.CharField(source="product.unit", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    low = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = ["id", "product", "product_name", "sku", "unit", "warehouse", "warehouse_name", "quantity", "low"]

    def get_low(self, obj):
        return obj.quantity <= obj.product.low_stock_threshold


class TransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True, default="")
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = ["id", "product", "product_name", "warehouse", "warehouse_name", "kind", "kind_label", "quantity_change", "balance_after", "unit_cost", "reference", "note", "created_by_email", "created_at"]


class StockActionSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.filter(is_active=True))
    quantity = serializers.IntegerField(min_value=0, max_value=10_000_000)
    unit_cost = serializers.DecimalField(max_digits=14, decimal_places=0, required=False, allow_null=True, min_value=0)
    reference = serializers.CharField(required=False, allow_blank=True, max_length=60)
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)


class WarehouseViewSet(SafeDeleteMixin, viewsets.ModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = MANAGER_UP
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    pagination_class = AdminPagination


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Tồn kho theo sản phẩm và kho. Nhập/xuất/điều chỉnh qua các action bên dưới."""

    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = WAREHOUSE_UP
    serializer_class = InventorySerializer
    pagination_class = AdminPagination
    search_fields = ["product__name", "product__sku"]
    filterset_fields = ["warehouse", "product"]

    def get_queryset(self):
        return Inventory.objects.select_related("product", "warehouse").order_by("product__name", "warehouse__name")

    def _run(self, request, fn, label):
        s = StockActionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        tx = fn(d)
        audit(request.user, f"inventory.{label}", d["product"].sku, warehouse=d["warehouse"].name, quantity=d["quantity"])
        return Response(TransactionSerializer(tx).data if tx else {"detail": "Không có thay đổi."}, status=201 if tx else 200)

    @action(detail=False, methods=["post"])
    def receive(self, request):
        return self._run(request, lambda d: services.receive(d["product"], d["warehouse"], d["quantity"], request.user, d.get("unit_cost"), d.get("reference", ""), d.get("note", "")), "receive")

    @action(detail=False, methods=["post"])
    def issue(self, request):
        return self._run(request, lambda d: services.issue(d["product"], d["warehouse"], d["quantity"], request.user, d.get("reference", ""), d.get("note", "")), "issue")

    @action(detail=False, methods=["post"])
    def adjust(self, request):
        """quantity là số lượng THỰC TẾ sau kiểm kê/điều chỉnh. Bắt buộc có ghi chú lý do."""
        if not str(request.data.get("note", "")).strip():
            raise BusinessError("Nhập lý do điều chỉnh/kiểm kê.")
        kind = "stocktake" if request.data.get("stocktake") else "adjust"
        return self._run(request, lambda d: services.adjust(d["product"], d["warehouse"], d["quantity"], request.user, d.get("note", ""), kind), "adjust")

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        qs = Product.objects.with_stock().filter(status=Product.ACTIVE, stock__lte=F("low_stock_threshold")).order_by("stock")[:100]
        return Response([{"id": p.id, "sku": p.sku, "name": p.name, "unit": p.unit, "stock": p.stock, "threshold": p.low_stock_threshold} for p in qs])

    @action(detail=False, methods=["get"])
    def summary(self, request):
        value = Inventory.objects.aggregate(v=Sum(ExpressionWrapper(F("quantity") * F("product__cost_price"), output_field=DecimalField(max_digits=20, decimal_places=0))))["v"] or 0
        return Response({"inventory_value": value, "total_units": Inventory.objects.aggregate(t=Sum("quantity"))["t"] or 0})


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = ALL_STAFF
    serializer_class = TransactionSerializer
    pagination_class = AdminPagination
    search_fields = ["product__name", "product__sku", "reference"]
    filterset_fields = ["kind", "warehouse", "product"]

    def get_queryset(self):
        return InventoryTransaction.objects.select_related("product", "warehouse", "created_by")
