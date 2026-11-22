"""API quản trị khách hàng, khách sỉ, nhóm khách và nhân viên."""
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.exceptions import BusinessError
from common.pagination import AdminPagination
from common.services import audit, notify

from .models import STAFF_ROLES, CustomerGroup, Role, User, WholesaleStatus
from .permissions import ALL_STAFF, MANAGER_UP, SALES_UP, SUPER_ONLY, StaffReadWrite


class CustomerGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerGroup
        fields = ["id", "name", "discount_percent", "description"]


class CustomerAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source="profile.company_name", read_only=True)
    tax_code = serializers.CharField(source="profile.tax_code", read_only=True)
    wholesale_status = serializers.CharField(source="profile.wholesale_status", read_only=True)
    customer_group = serializers.IntegerField(source="profile.customer_group_id", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "company_name", "tax_code", "wholesale_status", "customer_group", "is_active", "date_joined"]

    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}".strip()


class CustomerAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Khách hàng và duyệt khách sỉ."""

    permission_classes = [StaffReadWrite]
    read_roles = SALES_UP
    write_roles = MANAGER_UP
    serializer_class = CustomerAdminSerializer
    pagination_class = AdminPagination
    search_fields = ["email", "first_name", "phone", "profile__company_name", "profile__tax_code"]
    filterset_fields = {"profile__wholesale_status": ["exact"]}

    def get_queryset(self):
        return User.objects.filter(role=Role.CUSTOMER).select_related("profile").order_by("-date_joined")

    def _decide(self, request, pk, new_status, group_id=None):
        with transaction.atomic():
            user = get_object_or_404(self.get_queryset(), pk=pk)
            profile = user.profile
            if profile.wholesale_status != WholesaleStatus.PENDING:
                raise BusinessError("Chỉ xử lý được yêu cầu đang chờ duyệt.")
            profile.wholesale_status = new_status
            profile.approved_by = request.user
            profile.approved_at = timezone.now()
            if new_status == WholesaleStatus.APPROVED and group_id:
                profile.customer_group = CustomerGroup.objects.filter(pk=group_id).first()
            profile.save()
            audit(request.user, f"wholesale.{new_status}", user.email)
            notify(user, "Tài khoản sỉ đã được duyệt" if new_status == WholesaleStatus.APPROVED else "Yêu cầu tài khoản sỉ bị từ chối", link="/tai-khoan")
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._decide(request, pk, WholesaleStatus.APPROVED, request.data.get("customer_group"))

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._decide(request, pk, WholesaleStatus.REJECTED)


class CustomerGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = SALES_UP
    write_roles = MANAGER_UP
    queryset = CustomerGroup.objects.all().order_by("name")
    serializer_class = CustomerGroupSerializer
    pagination_class = AdminPagination


class StaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={"input_type": "password"})
    full_name = serializers.CharField(source="first_name")

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "role", "is_active", "password"]

    def validate_role(self, value):
        if value not in STAFF_ROLES:
            raise serializers.ValidationError("Vai trò nhân viên không hợp lệ.")
        return value

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def create(self, validated):
        password = validated.pop("password", "")
        if not password:
            raise serializers.ValidationError({"password": "Nhập mật khẩu cho nhân viên mới."})
        validated["username"] = validated["email"]
        return User.objects.create_user(password=password, **validated)

    def update(self, instance, validated):
        password = validated.pop("password", "")
        for key, value in validated.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class StaffViewSet(viewsets.ModelViewSet):
    """Chỉ Super Admin quản lý nhân viên và phân quyền."""

    permission_classes = [StaffReadWrite]
    read_roles = SUPER_ONLY
    write_roles = SUPER_ONLY
    serializer_class = StaffSerializer
    pagination_class = AdminPagination
    search_fields = ["email", "first_name", "phone"]
    http_method_names = ["get", "post", "patch", "head", "options"]  # không xóa cứng để giữ nhật ký

    def get_queryset(self):
        return User.objects.filter(role__in=STAFF_ROLES).order_by("email")

    def perform_update(self, serializer):
        user = self.get_object()
        if user.pk == self.request.user.pk and serializer.validated_data.get("is_active") is False:
            raise BusinessError("Không thể tự khóa tài khoản của chính mình.")
        serializer.save()
        audit(self.request.user, "staff.update", user.email, role=serializer.instance.role)
