import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';
import type { CredentialStatus, OrganizationSummary, OrganizationType } from '../api/types';
import { authService } from '../auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HolderCredentialRequestPayload {
  organization_id: string;
  credential_type_id: string;
  additional_claims: Record<string, unknown>;
}

export interface HolderRequestCatalogResponse {
  organization_types: Array<{
    id: string; name: string; description?: string;
    organizations?: Array<{
      id: string; name: string; organization_did?: string;
      credential_types?: Array<{ id: string; name: string }>;
    }>;
  }>;
  credential_types: Array<{ id: string; name: string }>;
}

// ── CredentialApi class ───────────────────────────────────────────────────────

class CredentialApi {
  private client: ApiClient;

  constructor() { this.client = new ApiClient(getApiConfig()); }

  private async token(): Promise<string | null> { return authService.getToken(); }

  // GET /wallet/my-credentials/
  async listCredentials(
    status?: CredentialStatus, page = 1, pageSize = 50,
  ): Promise<{ credentials: unknown[]; hasMore: boolean; total?: number }> {
    const token = await this.token();
    if (!token) {
      try {
        const cached = await AsyncStorage.getItem('cached_credentials');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) return { credentials: list, hasMore: false, total: list.length };
        }
      } catch {}
      return { credentials: [], hasMore: false };
    }
    try {
      const params = `page=${page}&page_size=${pageSize}${status ? `&status=${status}` : ''}`;
      const res = await this.client.get<unknown>(`/wallet/my-credentials/?${params}`, token);
      if (res && typeof res === 'object') {
        let results: unknown[] = [];
        let hasMore = false;
        let total = 0;
        if ('results' in (res as object) && Array.isArray((res as Record<string, unknown>).results)) {
          results = (res as Record<string, unknown>).results as unknown[];
          hasMore = !!(res as Record<string, unknown>).next;
          total = (res as Record<string, unknown>).count as number;
        } else if (Array.isArray(res)) {
          results = res;
          hasMore = false;
          total = res.length;
        }

        if (!status && page === 1 && results.length > 0) {
          await AsyncStorage.setItem('cached_credentials', JSON.stringify(results)).catch(() => {});
        }

        return { credentials: results, hasMore, total };
      }
    } catch { /* offline — fallback to cache */ }

    try {
      const cached = await AsyncStorage.getItem('cached_credentials');
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list)) return { credentials: list, hasMore: false, total: list.length };
      }
    } catch {}

    return { credentials: [], hasMore: false };
  }

  // GET /wallet/my-credentials/{id}/
  async getCredential(id: string): Promise<unknown> {
    const token = await this.token();
    if (!token) return null;
    try { return await this.client.get(`/wallet/my-credentials/${id}/`, token); }
    catch { return null; }
  }

  // POST /wallet/credentials/request/
  async createCredentialRequest(payload: HolderCredentialRequestPayload): Promise<unknown> {
    const token = await this.token();
    if (!token) throw new Error('Not authenticated');
    return this.client.post('/wallet/credentials/request/', payload, token);
  }

  // GET /wallet/request-catalog/
  async getRequestCatalog(): Promise<HolderRequestCatalogResponse> {
    const token = await this.token();
    if (!token) { const err = new Error('AUTH_REQUIRED'); (err as unknown as Record<string,unknown>).status = 401; throw err; }
    return this.client.get<HolderRequestCatalogResponse>('/wallet/request-catalog/', token);
  }

  // GET /organizations/types/
  async listOrganizationTypes(): Promise<OrganizationType[]> {
    const token = await this.token();
    if (!token) return [];
    try {
      const res = await this.client.get<unknown>('/organizations/types/', token);
      if (Array.isArray(res)) return res as OrganizationType[];
      if (res && 'results' in (res as object)) return (res as Record<string, unknown>).results as OrganizationType[];
    } catch { /* offline */ }
    return [];
  }

  // GET /organizations/?type_id=...
  async listOrganizations(typeId: string): Promise<OrganizationSummary[]> {
    const token = await this.token();
    if (!token) return [];
    try {
      const res = await this.client.get<unknown>(`/organizations/?type_id=${typeId}`, token);
      if (Array.isArray(res)) return res as OrganizationSummary[];
      if (res && 'results' in (res as object)) return (res as Record<string, unknown>).results as OrganizationSummary[];
    } catch { /* offline */ }
    return [];
  }

  // GET /credential-types/?org_type=...
  async listCredentialTypes(orgTypeName?: string): Promise<Array<{ id: string; name: string; description?: string }>> {
    const token = await this.token();
    if (!token) return [];
    try {
      const query = orgTypeName ? `?org_type=${encodeURIComponent(orgTypeName)}` : '';
      const res = await this.client.get<unknown>(`/credential-types/${query}`, token);
      if (Array.isArray(res)) return res as Array<{ id: string; name: string; description?: string }>;
      if (res && 'results' in (res as object)) return (res as Record<string, unknown>).results as Array<{ id: string; name: string; description?: string }>;
    } catch { /* offline */ }
    return [];
  }

  // POST /wallet/credentials/sync/
  async syncCredentials(): Promise<unknown> {
    const token = await this.token();
    if (!token) throw new Error('Not authenticated');
    return this.client.post('/wallet/credentials/sync/', {}, token);
  }
}

export const credentialApi = new CredentialApi();
