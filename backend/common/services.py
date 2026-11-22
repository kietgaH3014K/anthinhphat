from .models import AuditLog, Notification


def audit(user, action, target="", **detail):
    """Ghi nhật ký thao tác nhạy cảm (đổi trạng thái đơn, duyệt khách sỉ, điều chỉnh kho…)."""
    actor = user if getattr(user, "is_authenticated", False) else None
    return AuditLog.objects.create(user=actor, action=action, target=str(target), detail={k: str(v) for k, v in detail.items()})


def notify(user, title, body="", link=""):
    if user is None:
        return None
    return Notification.objects.create(user=user, title=title, body=body, link=link)
