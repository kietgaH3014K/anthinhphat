import re
import secrets
import unicodedata
from datetime import date


def strip_accents(value):
    value = unicodedata.normalize("NFD", str(value or "")).replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in value if unicodedata.category(c) != "Mn")


def normalize(value):
    """Chữ thường, bỏ dấu tiếng Việt: dùng cho tìm kiếm."""
    return strip_accents(value).lower()


def make_slug(value):
    return re.sub(r"[^a-z0-9]+", "-", normalize(value)).strip("-") or "muc"


def new_code(prefix):
    return f"{prefix}-{date.today():%y%m%d}-{secrets.token_hex(3).upper()}"
