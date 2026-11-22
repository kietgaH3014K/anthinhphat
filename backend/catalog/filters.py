import django_filters as df
from django_filters.widgets import BooleanWidget

from common.text import normalize

from .models import Category, Product


class ProductFilter(df.FilterSet):
    search = df.CharFilter(method="filter_search")
    category = df.CharFilter(method="filter_category")
    brand = df.CharFilter(field_name="brand__name", lookup_expr="iexact")
    min_price = df.NumberFilter(field_name="retail_price", lookup_expr="gte")
    max_price = df.NumberFilter(field_name="retail_price", lookup_expr="lte")
    featured = df.BooleanFilter(field_name="is_featured", widget=BooleanWidget())
    best_seller = df.BooleanFilter(field_name="is_best_seller", widget=BooleanWidget())
    new = df.BooleanFilter(field_name="is_new", widget=BooleanWidget())
    on_sale = df.BooleanFilter(field_name="on_sale", widget=BooleanWidget())
    ordering = df.OrderingFilter(fields=(("created_at", "created"), ("retail_price", "price"), ("name", "name")))

    class Meta:
        model = Product
        fields = []

    def filter_search(self, queryset, name, value):
        for term in normalize(value).split():
            queryset = queryset.filter(search_text__icontains=term)
        return queryset

    def filter_category(self, queryset, name, value):
        cat = Category.objects.filter(slug=value, is_active=True).first()
        return queryset.filter(category_id__in=cat.descendant_ids()) if cat else queryset.none()
