from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("orders", views.OrderViewSet, basename="order")
router.register("addresses", views.ShippingAddressViewSet, basename="address")

urlpatterns = router.urls
