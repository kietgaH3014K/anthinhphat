from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CustomerGroup, CustomerProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "username", "role", "phone", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("email", "username", "phone")
    fieldsets = BaseUserAdmin.fieldsets + (("Thông tin thêm", {"fields": ("phone", "role")}),)
    add_fieldsets = BaseUserAdmin.add_fieldsets + ((None, {"fields": ("email", "phone", "role")}),)


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "tax_code", "wholesale_status", "customer_group")
    list_filter = ("wholesale_status", "customer_group")
    search_fields = ("user__email", "company_name", "tax_code")


admin.site.register(CustomerGroup)
