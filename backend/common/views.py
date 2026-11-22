from django.db import connection
from rest_framework import mixins, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Notification, SiteConfig
from .serializers import NotificationSerializer, SiteConfigSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """Kiểm tra API và kết nối database (dùng cho giám sát khi triển khai)."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return Response({"status": "ok", "service": "an-thinh-phat-api"})


@api_view(["GET"])
@permission_classes([AllowAny])
def site_config(request):
    return Response(SiteConfigSerializer(SiteConfig.get()).data)


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        note = self.get_object()
        note.is_read = True
        note.save(update_fields=["is_read", "updated_at"])
        return Response(NotificationSerializer(note).data)
