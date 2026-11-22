from django.http import FileResponse, HttpResponse
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from accounts.permissions import ALL_STAFF, SALES_UP, StaffReadWrite
from common.exceptions import BusinessError
from common.pagination import AdminPagination
from common.services import audit, notify

from .models import Quotation
from .pdf import build_quotation_pdf
from .serializers import QuoteCreateSerializer, QuotationSerializer, parse_payload
from .validators import validate_attachment


def pdf_response(quote):
    resp = HttpResponse(build_quotation_pdf(quote), content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{quote.code}.pdf"'
    return resp


class QuotationViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Khách gửi yêu cầu báo giá (kể cả chưa đăng nhập) và xem báo giá của mình."""

    serializer_class = QuotationSerializer
    lookup_field = "code"
    filter_backends = []
    pagination_class = AdminPagination

    def get_permissions(self):
        return [AllowAny()] if self.action == "create" else [IsAuthenticated()]

    def get_throttles(self):
        if self.action == "create":
            self.throttle_scope = "quote"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        return Quotation.objects.filter(user=self.request.user).prefetch_related("items")

    def create(self, request, *args, **kwargs):
        s = QuoteCreateSerializer(data=parse_payload(request))
        s.is_valid(raise_exception=True)
        attachment = request.FILES.get("attachment")
        if attachment:
            validate_attachment(attachment)
        quote = s.create(s.validated_data, user=request.user, attachment=attachment)
        return Response({"code": quote.code, "status": quote.status}, status=201)

    @action(detail=True, methods=["get"])
    def pdf(self, request, code=None):
        quote = self.get_object()
        if quote.status not in (Quotation.SENT, Quotation.ACCEPTED):
            raise BusinessError("Báo giá chưa được gửi.")
        return pdf_response(quote)


class QuotationAdminViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [StaffReadWrite]
    read_roles = ALL_STAFF
    write_roles = SALES_UP
    serializer_class = QuotationSerializer
    lookup_field = "code"
    pagination_class = AdminPagination
    search_fields = ["code", "contact_name", "phone", "company"]
    filterset_fields = ["status"]
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_queryset(self):
        return Quotation.objects.prefetch_related("items")

    @action(detail=True, methods=["post"])
    def send(self, request, code=None):
        quote = self.get_object()
        if not quote.fully_priced():
            raise BusinessError("Cần nhập đơn giá cho tất cả hạng mục trước khi gửi báo giá.")
        quote.status = Quotation.SENT
        quote.sent_at = timezone.now()
        quote.save(update_fields=["status", "sent_at", "updated_at"])
        audit(request.user, "quotation.send", quote.code, total=quote.totals()["total"])
        notify(quote.user, f"Báo giá {quote.code} đã sẵn sàng", link="/tai-khoan")
        return Response(self.get_serializer(quote).data)

    @action(detail=True, methods=["get"])
    def pdf(self, request, code=None):
        return pdf_response(self.get_object())

    @action(detail=True, methods=["get"])
    def attachment(self, request, code=None):
        quote = self.get_object()
        if not quote.attachment:
            raise BusinessError("Yêu cầu này không có file đính kèm.")
        return FileResponse(quote.attachment.open("rb"), as_attachment=True, filename=quote.attachment_name or "dinh-kem")
