import logging

import httpx

from apps.credentials.models import Credential
from apps.credentials.services import CredentialService
from apps.issuer.views.integration import _get_issuer_org
from apps.organizations.models import OrganizationMember
from apps.organizations.serializers import OrganizationMemberSerializer
from common.api_response import error_response, success_response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class IssuerMemberListView(APIView):
    """List team members of the issuer's organisation."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = _get_issuer_org(request.user)
        if not org:
            return error_response(errors="No organization associated with this account", status_code=403)
        members = OrganizationMember.objects.filter(organization=org, is_active=True).select_related("user")
        return success_response(data=OrganizationMemberSerializer(members, many=True).data)


class IssuerMemberCheckView(APIView):
    """
    POST /api/v1/integration/members/check/

    Checks whether a national_id exists in the organization's external member API.
    Also checks whether a platform Holder with that NID already exists.
    Returns enough information for the issuer to decide whether to issue a credential.

    Expected request body:
        { "national_id": "NID-1234567890" }

    The view tries multiple mock-API endpoint patterns so it works regardless of
    whether the org uses the new federated API (/orgs/{type}/api/v1/entities/search)
    or the legacy verify endpoint (/api/members/verify).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = _get_issuer_org(request.user)
        if not org:
            return error_response(errors="No organization associated with this account", status_code=403)

        national_id = (
            request.data.get("national_id")
            or request.data.get("identifier")
            or request.data.get("member_id")
        )
        if not national_id:
            return error_response(errors="'national_id' is required", status_code=400)

        # First check if this holder already has a credential from this org
        existing_cred = Credential.objects.filter(
            organization=org, national_id=national_id
        ).order_by("-created_at").first()

        platform_holder = None
        from apps.national_id.models import NationalIDVerification
        try:
            nid_obj = NationalIDVerification.objects.select_related("user").get(
                fin=national_id, verified=True
            )
            platform_holder = {
                "user_id": str(nid_obj.user.id),
                "name": nid_obj.user.name,
                "email": nid_obj.user.email,
            }
        except NationalIDVerification.DoesNotExist:
            pass

        base_url = org.base_api_url
        if not base_url:
            # No external API — can still return platform info
            return success_response(data={
                "is_member": False,
                "detail": "Organization has no external API configured",
                "platform_holder": platform_holder,
                "existing_credential": _cred_summary(existing_cred),
            })

        # Try the mock API's /api/members/verify endpoint (legacy & new)
        member_data = None
        errors_tried = []

        endpoints_to_try = [
            ("POST", f"{base_url.rstrip('/')}/api/members/verify", {"national_id": national_id}),
        ]

        # Also try org-type-specific paths
        org_type_name = ""
        if org.org_type:
            org_type_name = org.org_type.name.lower()
            type_map = {
                "university": "university",
                "government agency": "government",
                "private company": "employer",
                "hospital": "hospital",
            }
            mapped = type_map.get(org_type_name)
            if mapped:
                endpoints_to_try.append((
                    "POST",
                    f"{base_url.rstrip('/')}/{mapped}/members/verify",
                    {"national_id": national_id},
                ))

        headers = {}
        config = getattr(org, "integration_config", None)
        if config and config.api_key:
            header_name = config.api_key_header_name or "Authorization"
            if config.auth_type == "bearer_token":
                headers[header_name] = f"Bearer {config.api_key}"
            else:
                headers[header_name] = config.api_key
        elif org.api_token:
            headers["Authorization"] = f"Bearer {org.api_token}"

        for method, url, payload in endpoints_to_try:
            try:
                with httpx.Client(timeout=10) as client:
                    if method == "POST":
                        resp = client.post(url, json=payload, headers=headers)
                    else:
                        resp = client.get(url, headers=headers)

                if resp.status_code in (200, 201):
                    data = resp.json()
                    # Normalise response — mock API returns {is_eligible, member: {...}}
                    if "is_eligible" in data:
                        m = data.get("member") or {}
                        member_data = {
                            "is_member": data["is_eligible"],
                            "full_name": m.get("full_name"),
                            "email": m.get("email"),
                            "national_id": m.get("national_id", national_id),
                            "org_type": m.get("org_type") or data.get("org_type"),
                            "org_name": m.get("org_name") or data.get("org_name"),
                            "department": m.get("department"),
                            "status": m.get("status"),
                        }
                    else:
                        member_data = {
                            "is_member": data.get("is_active", bool(data.get("national_id"))),
                            "full_name": data.get("full_name"),
                            "email": data.get("email"),
                            "national_id": data.get("national_id", national_id),
                        }
                    break
                elif resp.status_code == 404:
                    member_data = {"is_member": False, "detail": f"No member found: {national_id}"}
                    break
                else:
                    errors_tried.append(f"{url} → HTTP {resp.status_code}")
            except httpx.ConnectError:
                errors_tried.append(f"{url} → connection refused")
            except httpx.TimeoutException:
                errors_tried.append(f"{url} → timeout")
            except Exception as e:
                errors_tried.append(f"{url} → {e}")

        if member_data is None:
            return error_response(
                errors=f"Could not reach org API. Tried: {'; '.join(errors_tried)}",
                status_code=502,
            )

        return success_response(data={
            **member_data,
            "platform_holder": platform_holder,
            "existing_credential": _cred_summary(existing_cred),
        })


def _cred_summary(cred):
    if not cred:
        return None
    return {
        "credential_id": cred.credential_id,
        "status": cred.status,
        "issued_at": cred.issued_at.isoformat() if cred.issued_at else None,
        "credential_type": cred.credential_type,
    }
