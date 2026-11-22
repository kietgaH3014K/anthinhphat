from rest_framework import serializers, viewsets

from accounts.permissions import MANAGER_UP, SALES_UP, StaffReadWrite
from common.pagination import AdminPagination

from .models import Promotion


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ["id", "code", "description", "percent", "min_order", "starts_at", "ends_at", "max_uses", "used_count", "is_active"]
        read_only_fields = ["used_count"]
        extra_kwargs = {"percent": {"min_value": 0, "max_value": 100}}

    def validate_code(self, value):
        value = value.strip().upper()
        qs = Promotion.objects.filter(code=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Mã này đã tồn tại.")
        return value


class PromotionViewSet(viewsets.ModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = SALES_UP
    write_roles = MANAGER_UP
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    pagination_class = AdminPagination
    search_fields = ["code", "description"]
