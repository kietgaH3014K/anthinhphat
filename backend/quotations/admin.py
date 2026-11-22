from django.contrib import admin

from .models import Quotation, QuotationItem


class ItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 0


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ("code", "contact_name", "company", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("code", "contact_name", "phone", "company")
    inlines = [ItemInline]
