from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("notifications", views.NotificationViewSet, basename="notification")

urlpatterns = [
    path("health/", views.health, name="health"),
    path("site-config/", views.site_config, name="site-config"),
] + router.urls
