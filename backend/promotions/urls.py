from django.urls import path

from . import views

urlpatterns = [path("promotions/validate/", views.validate_coupon, name="coupon-validate")]
