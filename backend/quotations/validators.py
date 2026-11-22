from rest_framework import serializers

MAX_BYTES = 10 * 1024 * 1024
# phần mở rộng -> chữ ký đầu file (kiểm tra nội dung thật, không chỉ tin tên file)
SIGNATURES = {
    ".pdf": (b"%PDF",),
    ".xlsx": (b"PK\x03\x04",),
    ".xls": (b"\xd0\xcf\x11\xe0",),
}


def validate_attachment(file):
    name = (file.name or "").lower()
    ext = name[name.rfind("."):] if "." in name else ""
    if ext not in SIGNATURES:
        raise serializers.ValidationError("Chỉ nhận file Excel (.xlsx, .xls) hoặc PDF.")
    if file.size > MAX_BYTES:
        raise serializers.ValidationError("File quá lớn, tối đa 10 MB.")
    head = file.read(8)
    file.seek(0)
    if not any(head.startswith(sig) for sig in SIGNATURES[ext]):
        raise serializers.ValidationError("Nội dung file không đúng định dạng.")
    return file
