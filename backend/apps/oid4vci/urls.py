from django.urls import path

from apps.oid4vci.views import CredentialIssuerMetadataView, JWKSView, OpenIDConfigurationView

urlpatterns = [
    path("openid-credential-issuer", CredentialIssuerMetadataView.as_view()),
    path("openid-configuration", OpenIDConfigurationView.as_view()),
    path("jwks/", JWKSView.as_view()),
]
