from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.pagination import AdminPagination

from . import services
from .models import SalesOrder, ShippingAddress
from .serializers import OrderCreateSerializer, OrderSerializer, ShippingAddressSerializer


class OrderViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Đơn hàng của chính người dùng."""

    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = "code"
    filter_backends = []
    pagination_class = AdminPagination

    def get_queryset(self):
        return SalesOrder.objects.filter(user=self.request.user).prefetch_related("items")

    def create(self, request, *args, **kwargs):
        s = OrderCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        order = services.place_order(
            request.user, d["items"], d["shipping_address"], d["payment_method"], d.get("coupon_code"), d.get("note", ""),
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, code=None):
        order = self.get_object()
        order = services.change_status(order.pk, SalesOrder.CANCELLED, request.user, by_customer=True)
        return Response(OrderSerializer(order).data)


class ShippingAddressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ShippingAddressSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return ShippingAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
