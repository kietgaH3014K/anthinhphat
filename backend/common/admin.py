from django.contrib import admin

from .models import AuditLog, Notification, SiteConfig

admin.site.register(SiteConfig)
admin.site.register(Notification)


@admin.register(AuditLog)
class AuditAdmin(admin.ModelAdmin):
    list_display = ("created_at", "user", "action", "target")
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False
