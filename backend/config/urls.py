from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from catalog.views import robots_txt, sitemap_xml

urlpatterns = [
    path("quan-tri-django/", admin.site.urls),
    path("api/v1/manage/", include("config.manage_urls")),
    path("api/v1/", include("common.urls")),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("catalog.urls")),
    path("api/v1/", include("orders.urls")),
    path("api/v1/", include("quotations.urls")),
    path("api/v1/", include("promotions.urls")),
    path("robots.txt", robots_txt),
    path("sitemap.xml", sitemap_xml),
]

if settings.DEBUG:  # chỉ ảnh sản phẩm (công khai); file báo giá nằm ở PRIVATE_MEDIA_ROOT, không được phục vụ công khai
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
