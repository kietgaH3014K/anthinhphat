from django.contrib import admin

from .models import PurchaseOrder, PurchaseOrderItem, Supplier


class ItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0


@admin.register(PurchaseOrder)
class POAdmin(admin.ModelAdmin):
    list_display = ("code", "supplier", "warehouse", "status", "created_at")
    inlines = [ItemInline]


admin.site.register(Supplier)
