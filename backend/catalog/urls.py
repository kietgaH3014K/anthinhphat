from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("products", views.ProductViewSet, basename="product")
router.register("categories", views.CategoryViewSet, basename="category")
router.register("brands", views.BrandViewSet, basename="brand")

urlpatterns = router.urls
