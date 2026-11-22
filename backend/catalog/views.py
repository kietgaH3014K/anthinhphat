from django.http import HttpResponse
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from common.exceptions import BusinessError

from .filters import ProductFilter
from .models import Brand, Category, Product, Review
from .serializers import BrandSerializer, CategorySerializer, ProductSerializer, ReviewSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter

    def get_queryset(self):
        return (
            Product.objects.with_stock()
            .filter(status=Product.ACTIVE, category__is_active=True)
            .select_related("category", "brand")
            .prefetch_related("images", "group_prices")
        )

    @action(detail=True, methods=["get", "post"], url_path="reviews")
    def reviews(self, request, slug=None):
        product = self.get_object()
        if request.method == "GET":
            qs = product.reviews.filter(is_approved=True).select_related("user")[:50]
            return Response(ReviewSerializer(qs, many=True).data)
        if not request.user.is_authenticated:
            raise NotAuthenticated()
        from orders.models import OrderItem  # tránh import vòng

        bought = OrderItem.objects.filter(product=product, order__user=request.user, order__status="completed").exists()
        if not bought:
            raise BusinessError("Bạn chỉ đánh giá được sản phẩm đã mua và nhận hàng.")
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review, _ = Review.objects.update_or_create(product=product, user=request.user, defaults=serializer.validated_data)
        return Response(ReviewSerializer(review).data, status=201)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None
    lookup_field = "slug"
    filter_backends = []

    def get_queryset(self):
        return Category.objects.filter(is_active=True).select_related("parent")


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = BrandSerializer
    pagination_class = None
    filter_backends = []

    def get_queryset(self):
        return Brand.objects.filter(is_active=True)


def robots_txt(request):
    base = settings.FRONTEND_URL.rstrip("/")
    body = f"User-agent: *\nAllow: /\nDisallow: /quan-tri\nDisallow: /tai-khoan\nDisallow: /thanh-toan\nSitemap: {base}/sitemap.xml\n"
    return HttpResponse(body, content_type="text/plain; charset=utf-8")


def sitemap_xml(request):
    base = settings.FRONTEND_URL.rstrip("/")
    urls = [f"{base}/", f"{base}/san-pham", f"{base}/bao-gia", f"{base}/gioi-thieu", f"{base}/lien-he"]
    urls += [f"{base}/san-pham?category={s}" for s in Category.objects.filter(is_active=True).values_list("slug", flat=True)]
    urls += [f"{base}/san-pham/{s}" for s in Product.objects.filter(status=Product.ACTIVE).values_list("slug", flat=True)]
    items = "".join(f"<url><loc>{u.replace('&', '&amp;')}</loc></url>" for u in urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{items}</urlset>'
    return HttpResponse(xml, content_type="application/xml; charset=utf-8")
