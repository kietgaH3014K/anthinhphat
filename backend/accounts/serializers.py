from rest_framework import serializers

from .models import User


class MeSerializer(serializers.ModelSerializer):
    wholesale_status = serializers.CharField(source="profile.wholesale_status", read_only=True)
    company_name = serializers.CharField(source="profile.company_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "phone", "role", "company_name", "wholesale_status"]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    """Đăng ký khách lẻ hoặc khách sỉ. Role luôn là customer; khách sỉ phải chờ Admin duyệt."""

    ACCOUNT_TYPES = (("personal", "Cá nhân"), ("wholesale", "Doanh nghiệp / đại lý"))

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    full_name = serializers.CharField(max_length=150)
    phone = serializers.RegexField(r"^(0|\+84)\d{9}$", error_messages={"invalid": "Số điện thoại không hợp lệ."})
    account_type = serializers.ChoiceField(choices=ACCOUNT_TYPES, default="personal")
    company_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    tax_code = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email này đã được đăng ký.")
        return value

    def validate_password(self, value):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError

        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        if attrs.get("account_type") == "wholesale" and not attrs.get("company_name", "").strip():
            raise serializers.ValidationError({"company_name": "Khách sỉ cần nhập tên công ty."})
        return attrs

    def create(self, validated):
        from django.db import transaction

        from .models import WholesaleStatus

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated["email"],
                email=validated["email"],
                password=validated["password"],
                first_name=validated["full_name"],
                phone=validated["phone"],
            )
            if validated["account_type"] == "wholesale":
                profile = user.profile
                profile.company_name = validated["company_name"].strip()
                profile.tax_code = validated.get("tax_code", "").strip()
                profile.wholesale_status = WholesaleStatus.PENDING
                profile.save()
        return user
