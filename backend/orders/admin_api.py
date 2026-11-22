from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import ALL_STAFF, SALES_UP, StaffReadWrite
from common.pagination import AdminPagination

from . import services
from .models import SalesOrder
from .serializers import OrderAdminSerializer


class StatusInput(serializers.Serializer):
    status = serializers.ChoiceField(choices=[s for s, _ in SalesOrder.STATUS])


class OrderAdminViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = SALES_UP
    serializer_class = OrderAdminSerializer
    lookup_field = "code"
    pagination_class = AdminPagination
    search_fields = ["code", "user__email", "ship_phone", "ship_full_name"]
    filterset_fields = ["status", "payment_status", "payment_method", "is_wholesale"]

    def get_queryset(self):
        return SalesOrder.objects.select_related("user").prefetch_related("items")

    @action(detail=True, methods=["post"], url_path="set-status")
    def set_status(self, request, code=None):
        s = StatusInput(data=request.data)
        s.is_valid(raise_exception=True)
        order = services.change_status(self.get_object().pk, s.validated_data["status"], request.user)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, code=None):
        order = services.mark_paid(self.get_object().pk, request.user)
        return Response(self.get_serializer(order).data)
