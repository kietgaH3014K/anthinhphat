from django.contrib import admin

from .models import OrderItem, Payment, SalesOrder, ShippingAddress


class ItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "name", "unit", "qty", "unit_price", "line_total")
    can_delete = False


@admin.register(SalesOrder)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("code", "user", "status", "payment_status", "total", "created_at")
    list_filter = ("status", "payment_status")
    search_fields = ("code", "user__email", "ship_phone")
    inlines = [ItemInline]


admin.site.register(Payment)
admin.site.register(ShippingAddress)
