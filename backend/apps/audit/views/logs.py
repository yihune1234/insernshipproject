import datetime

from django.utils import timezone

from apps.audit.models import AuditLog
from apps.audit.serializers.log import AuditLogSerializer
from common.api_response import error_response, success_response
from common.permissions import IsAdmin
from rest_framework.views import APIView


class AuditLogListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = AuditLog.objects.all()
        action = request.query_params.get("action")
        entity_type = request.query_params.get("entity_type")
        if action:
            qs = qs.filter(action__icontains=action)
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        return success_response(data=AuditLogSerializer(qs[:200], many=True).data)

    def delete(self, request):
        days = request.query_params.get("older_than_days", "90")
        try:
            days = int(days)
        except ValueError:
            days = 90
        cutoff = timezone.now() - datetime.timedelta(days=days)
        count, _ = AuditLog.objects.filter(created_at__lt=cutoff).delete()
        return success_response(message=f"Purged {count} audit logs older than {days} days")


class AuditLogDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            log = AuditLog.objects.get(id=pk)
            return success_response(data=AuditLogSerializer(log).data)
        except AuditLog.DoesNotExist:
            return error_response(errors="Not found", status_code=404)

    def delete(self, request, pk):
        try:
            log = AuditLog.objects.get(id=pk)
            log.delete()
            return success_response(message="Audit log entry deleted")
        except AuditLog.DoesNotExist:
            return error_response(errors="Not found", status_code=404)
