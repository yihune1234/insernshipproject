from django.db import models

from common.models import BaseModel


class OrgDocument(BaseModel):
    DOC_TYPE_CHOICES = [
        ("business_license", "Business License"),
        ("tax_clearance", "Tax Clearance"),
        ("accreditation", "Accreditation"),
        ("authorization", "Authorization"),
        ("other", "Other"),
    ]

    registration = models.ForeignKey(
        "organizations.OrgRegistration", on_delete=models.CASCADE, related_name="documents"
    )
    document_type = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to="org_documents/")
    file_name = models.CharField(max_length=255)
    verified = models.BooleanField(default=False)

    class Meta:
        db_table = "organizations_document"
