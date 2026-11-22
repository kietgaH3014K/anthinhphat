from datetime import timedelta

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import Role, User
from accounts.permissions import ALL_STAFF, MANAGER_UP, HasRole
from catalog.models import Product
from inventory.models import Inventory
from orders.models import OrderItem, SalesOrder

from .models import AuditLog, SiteConfig
from .serializers import SiteConfigSerializer

OPEN_STATUSES = [SalesOrder.PENDING, SalesOrder.CONFIRMED, SalesOrder.SHIPPING]


@api_view(["GET"])
@permission_classes([HasRole.of(*MANAGER_UP)])
def dashboard(request):
    """Số liệu tổng quan. Doanh thu chỉ tính đơn đã hoàn thành."""
    completed = SalesOrder.objects.filter(status=SalesOrder.COMPLETED)
    since = timezone.now() - timedelta(days=29)
    by_day = (
        completed.filter(created_at__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day").annotate(revenue=Sum("total"), orders=Count("id")).order_by("day")
    )
    best = (
        OrderItem.objects.exclude(order__status=SalesOrder.CANCELLED)
        .values("product_id", "name", "unit").annotate(total_qty=Sum("qty"), total_revenue=Sum("line_total")).order_by("-total_qty")[:5]
    )
    value = Inventory.objects.aggregate(
        v=Sum(ExpressionWrapper(F("quantity") * F("product__cost_price"), output_field=DecimalField(max_digits=20, decimal_places=0)))
    )["v"] or 0
    low = Product.objects.with_stock().filter(status=Product.ACTIVE, stock__lte=F("low_stock_threshold")).order_by("stock")[:10]
    new_orders = SalesOrder.objects.select_related("user")[:5]
    return Response({
        "total_revenue": completed.aggregate(t=Sum("total"))["t"] or 0,
        "total_orders": SalesOrder.objects.count(),
        "open_orders": SalesOrder.objects.filter(status__in=OPEN_STATUSES).count(),
        "customers": User.objects.filter(role=Role.CUSTOMER).count(),
        "products": Product.objects.count(),
        "inventory_value": value,
        "revenue_by_day": [{"day": r["day"].isoformat(), "revenue": r["revenue"], "orders": r["orders"]} for r in by_day],
        "best_sellers": [{"product_id": b["product_id"], "name": b["name"], "unit": b["unit"], "qty": b["total_qty"], "revenue": b["total_revenue"]} for b in best],
        "new_orders": [{"code": o.code, "customer": o.user.email, "total": o.total, "status": o.status, "created_at": o.created_at} for o in new_orders],
        "low_stock": [{"id": p.id, "sku": p.sku, "name": p.name, "unit": p.unit, "stock": p.stock, "threshold": p.low_stock_threshold} for p in low],
    })


@api_view(["GET", "PATCH"])
@permission_classes([HasRole.of(*MANAGER_UP)])
def site_config_admin(request):
    config = SiteConfig.get()
    if request.method == "PATCH":
        s = SiteConfigSerializer(config, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        from .services import audit

        audit(request.user, "siteconfig.update", "site")
        return Response(s.data)
    return Response(SiteConfigSerializer(config).data)


class AuditSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default="")

    class Meta:
        model = AuditLog
        fields = ["id", "user_email", "action", "target", "detail", "created_at"]


@api_view(["GET"])
@permission_classes([HasRole.of(Role.SUPER_ADMIN)])
def audit_log(request):
    return Response(AuditSerializer(AuditLog.objects.select_related("user")[:200], many=True).data)
