from django.contrib import admin

from .models import Brand, Category, Product, ProductImage, ProductPrice, Review


class ImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class PriceInline(admin.TabularInline):
    model = ProductPrice
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "category", "brand", "retail_price", "status")
    list_filter = ("status", "category", "brand")
    search_fields = ("sku", "name")
    inlines = [ImageInline, PriceInline]


admin.site.register(Category)
admin.site.register(Brand)
admin.site.register(Review)
