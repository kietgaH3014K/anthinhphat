from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("quotations", views.QuotationViewSet, basename="quotation")

urlpatterns = router.urls
