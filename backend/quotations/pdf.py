from io import BytesIO
from xml.sax.saxutils import escape as esc
from pathlib import Path

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from common.models import SiteConfig

FONT_DIR = Path(settings.BASE_DIR) / "assets" / "fonts"
_registered = False


def _fonts():
    """Font DejaVu có đủ dấu tiếng Việt (font mặc định của PDF không có)."""
    global _registered
    if not _registered:
        pdfmetrics.registerFont(TTFont("VN", str(FONT_DIR / "DejaVuSans.ttf")))
        pdfmetrics.registerFont(TTFont("VN-Bold", str(FONT_DIR / "DejaVuSans-Bold.ttf")))
        _registered = True


def money(value):
    return f"{int(value):,}".replace(",", ".") + " đ"


def quantity(value):
    return f"{value:f}".rstrip("0").rstrip(".") if "." in f"{value:f}" else f"{value}"


def build_quotation_pdf(quote):
    _fonts()
    cfg = SiteConfig.get()
    base = ParagraphStyle("base", fontName="VN", fontSize=9.5, leading=13)
    bold = ParagraphStyle("bold", parent=base, fontName="VN-Bold")
    title = ParagraphStyle("title", parent=base, fontName="VN-Bold", fontSize=16, leading=20, spaceAfter=4)
    small = ParagraphStyle("small", parent=base, fontSize=8.5, textColor=colors.HexColor("#6B7076"))

    story = [
        Paragraph(esc(cfg.company_name), title),
        Paragraph(esc(" · ".join(x for x in [cfg.address, f"Hotline: {cfg.hotline}" if cfg.hotline else ""] if x)), small),
        Spacer(1, 8 * mm),
        Paragraph(f"BÁO GIÁ {quote.code}", ParagraphStyle("h", parent=title, fontSize=14)),
        Paragraph(f"Ngày lập: {quote.created_at:%d/%m/%Y}" + (f" · Hiệu lực đến: {quote.valid_until:%d/%m/%Y}" if quote.valid_until else ""), small),
        Spacer(1, 4 * mm),
        Paragraph(f"<b>Khách hàng:</b> {esc(quote.contact_name)}" + (f" – {esc(quote.company)}" if quote.company else ""), base),
        Paragraph(f"<b>Điện thoại:</b> {esc(quote.phone)} · <b>Email:</b> {esc(quote.email)}", base),
        Paragraph(f"<b>Công trình:</b> {esc(quote.site_address)}", base),
        Paragraph(f"<b>Ngày giao mong muốn:</b> {quote.desired_date:%d/%m/%Y}", base),
        Spacer(1, 5 * mm),
    ]

    head = ["STT", "Vật liệu", "ĐVT", "Số lượng", "Đơn giá", "Thành tiền"]
    rows = [[Paragraph(h, bold) for h in head]]
    for n, it in enumerate(quote.items.all(), 1):
        rows.append([
            str(n), Paragraph(esc(it.product_name), base), esc(it.unit), quantity(it.quantity),
            money(it.unit_price) if it.unit_price is not None else "Liên hệ",
            money(it.line_total) if it.unit_price is not None else "—",
        ])
    table = Table(rows, colWidths=[12 * mm, 62 * mm, 16 * mm, 22 * mm, 30 * mm, 32 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "VN"), ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECEEF0")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B4B8BD")),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story += [table, Spacer(1, 4 * mm)]

    t = quote.totals()
    sums = [["Tạm tính", money(t["subtotal"])]]
    if t["discount"]:
        sums.append([f"Chiết khấu ({quote.discount_percent:g}%)", "-" + money(t["discount"])])
    sums += [["Vận chuyển", money(t["shipping"])], ["TỔNG CỘNG", money(t["total"])]]
    totals = Table(sums, colWidths=[110 * mm, 64 * mm])
    totals.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "VN"), ("FONTNAME", (0, -1), (-1, -1), "VN-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"), ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.HexColor("#25282C")),
    ]))
    story.append(totals)
    if quote.staff_note:
        story += [Spacer(1, 6 * mm), Paragraph("<b>Ghi chú:</b> " + esc(quote.staff_note), base)]
    story += [Spacer(1, 10 * mm), Paragraph(f"{esc(cfg.company_name)} – Chất lượng tạo niềm tin, đồng hành cùng mọi công trình.", small)]

    buffer = BytesIO()
    SimpleDocTemplate(buffer, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm, title=f"Báo giá {quote.code}").build(story)
    return buffer.getvalue()
