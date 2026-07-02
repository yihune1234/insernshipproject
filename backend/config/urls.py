from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/national-id/", include("apps.national_id.urls")),
    path("api/v1/did/", include("apps.did.urls")),
    path("api/v1/organizations/", include("apps.organizations.urls")),
    path("api/v1/trust/", include("apps.trust_registry.urls")),
    path("api/v1/credentials/", include("apps.credentials.urls")),
    path("api/v1/wallet/", include("apps.holder.urls")),
    path("api/v1/verification/", include("apps.verification.urls")),
    path("api/v1/verifier/", include("apps.verifier.urls")),
    path("api/v1/integration/", include("apps.issuer.urls")),
    path("api/v1/admin-portal/", include("apps.admin_portal.urls")),
    path("api/v1/audit/", include("apps.audit.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path(".well-known/", include("apps.oid4vci.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar
        urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    except (ImportError, Exception):
        pass
