// All shared API type definitions (ported from holderapp)

export interface ApiErrorResponse {
  detail?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface OrganizationType { id: string; name: string; description?: string | null; }
export interface OrganizationSummary {
  id: string; name: string; organization_type: OrganizationType;
  organization_did: string; is_active: boolean; created_at: string;
}

export type CredentialStatus = 'active' | 'revoked' | 'expired';

export interface CredentialType {
  id: string; name: string; version: number; description: string;
  allowed_organization_type: string; is_active: boolean;
  created_by: string; created_by_email: string; created_at: string; updated_at: string;
}

export interface CredentialSchema {
  id: string; type_id: string; option_id?: string; fields: Array<{ name: string; type: string; required: boolean }>;
}

export interface Credential {
  id: string; credential_uuid: string; holder_did: string;
  organization: string; organization_name: string;
  credential_type: string; credential_type_name: string;
  claims?: Record<string, unknown>; credential_jwt: string;
  status: CredentialStatus; issued_at: string; expires_at: string | null;
}

export interface Wallet {
  id: string; wallet_name: string; device_id: string; created_at: string; primary_did: string;
}

export interface DIDSummary {
  id: string; did: string; method: string; is_primary: boolean; created_at: string; key_count: number;
}

export interface Presentation {
  id: string; holder_did: string; verifier_org_name: string;
  presentation_jwt: string; created_at: string;
}

export interface CreatePresentationRequest {
  credential_ids?: string[];
  credential_id?: string;
  verifier_org_id?: string | null;
  verification_request_id?: string | null;
  disclosed_claims?: Record<string, unknown> | string[];
}

export interface VerificationRequestDetail {
  id: string; verifier_org_name: string; purpose?: string;
  credential_type_name?: string; required_claims?: string[];
  disclosed_claims?: string[]; expires_at: string;
}

export interface HolderGeneratePresentationRequest {
  credential_ids: string[]; disclosed_claims: string[];
  callback_url?: string; expires_in_minutes?: number;
}

export interface HolderGeneratePresentationResponse {
  id: string; holder_did: string; status: string;
  is_holder_initiated: boolean; presentation_jwt?: string; created_at: string;
}

export interface HolderVerificationHistoryItem {
  verified_at: string; verifier_org: string;
  credentials: string[]; status: string; presentation_id: string;
}
