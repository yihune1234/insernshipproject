import base64
import io
import json
import logging

import qrcode
from django.utils import timezone

from apps.credentials.models import Credential
from apps.did.models import DIDKey
from apps.did.utils.crypto import sign_message
from apps.did.utils.key_storage import decrypt_private_key
from apps.holder.models import Presentation

logger = logging.getLogger(__name__)


class PresentationService:
    """
    Phase 11: Create presentations for sharing credentials with verifiers.
    
    Ensures only non-revoked, non-expired credentials can be included in presentations.
    """

    @classmethod
    def create(cls, holder, credentials_list: list):
        """
        Create a presentation from holder's selected credentials.
        
        Args:
            holder: Holder user
            credentials_list: List of dicts with credential_id and disclosed_claims
            
        Returns:
            Presentation: Created presentation instance
            
        Raises:
            ValueError: If any credential is revoked/expired or doesn't belong to holder
        """
        # Phase 11: Validate no revoked/expired credentials included
        presentation_data = {"holder": str(holder.id), "credentials": []}
        invalid_credentials = []

        for item in credentials_list:
            try:
                cred = Credential.objects.get(id=item["credential_id"], holder=holder)

                # Phase 11: Prevent revoked credentials in presentations
                if cred.status == "revoked":
                    invalid_credentials.append({
                        "credential_id": str(cred.id),
                        "reason": "revoked",
                        "message": f"Credential revoked: {cred.revocation_reason}"
                    })
                    continue

                # Phase 11: Prevent expired credentials in presentations
                if cred.status == "expired":
                    invalid_credentials.append({
                        "credential_id": str(cred.id),
                        "reason": "expired",
                        "message": f"Credential expired on {cred.expires_at}"
                    })
                    continue

                # Include credential in presentation with only disclosed claims
                disclosed = {k: v for k, v in cred.data.items() if k in item.get("disclosed_claims", [])}
                presentation_data["credentials"].append({
                    "credential_id": str(cred.id),
                    "credential_type": cred.credential_type,
                    "disclosed": disclosed,
                })
            except Credential.DoesNotExist:
                invalid_credentials.append({
                    "credential_id": item.get("credential_id"),
                    "reason": "not_found",
                    "message": "Credential not found or not owned by holder"
                })

        if invalid_credentials:
            raise ValueError(
                f"Cannot create presentation: {len(invalid_credentials)} credential(s) invalid. "
                f"Details: {invalid_credentials}"
            )

        if not presentation_data["credentials"]:
            raise ValueError("No valid credentials to include in presentation")

        signed_data = None
        try:
            did_doc = holder.did_documents.filter(status="active").first()
            if did_doc:
                key = DIDKey.objects.filter(
                    did_document=did_doc, purpose="assertionMethod", is_active=True
                ).first()
                if key:
                    priv_hex = decrypt_private_key(key.encrypted_private_key)
                    payload = json.dumps(presentation_data, sort_keys=True).encode()
                    sig = sign_message(bytes.fromhex(priv_hex), payload)
                    signed_data = base64.b64encode(sig).decode()
        except Exception as e:
            logger.warning("Failed to sign presentation: %s", e)

        qr_code_url = None
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(json.dumps(presentation_data))
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            qr_code_url = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
        except Exception as e:
            logger.warning("Failed to generate QR code: %s", e)

        pres = Presentation.objects.create(
            holder=holder,
            credentials=presentation_data["credentials"],
            signed_data=signed_data,
            qr_code_url=qr_code_url,
        )
        return pres
