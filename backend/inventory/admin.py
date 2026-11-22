from django.contrib import admin

from .models import Inventory, InventoryTransaction, Warehouse

admin.site.register(Warehouse)
admin.site.register(Inventory)


@admin.register(InventoryTransaction)
class TxAdmin(admin.ModelAdmin):
    list_display = ("created_at", "product", "warehouse", "kind", "quantity_change", "balance_after")
    list_filter = ("kind", "warehouse")
    readonly_fields = [f.name for f in InventoryTransaction._meta.fields]

    def has_add_permission(self, request):
        return False  # nhật ký kho chỉ được tạo bởi nghiệp vụ, không sửa tay
