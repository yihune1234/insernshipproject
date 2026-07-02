import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';
import { authService } from '../auth';

class PresentationApi {
  private client: ApiClient;
  constructor() { this.client = new ApiClient(getApiConfig()); }

  private async token(): Promise<string> {
    const t = await authService.getToken();
    if (!t) throw new Error('Not authenticated');
    return t;
  }

  // GET /wallet/presentations/
  async listPresentations(): Promise<unknown[]> {
    return this.client.get<unknown[]>('/wallet/presentations/', await this.token());
  }

  // POST /wallet/presentations/
  async createPresentation(credentials: string[]): Promise<unknown> {
    return this.client.post('/wallet/presentations/', { credentials }, await this.token());
  }

  // POST /wallet/presentations/ — with full payload
  async generateHolderPresentation(payload: {
    credential_ids: string[];
    verifier_did?: string;
    requested_claims?: string[];
  }): Promise<unknown> {
    return this.client.post('/wallet/presentations/', payload, await this.token());
  }

  // GET /wallet/presentations/{id}/
  async getPresentation(id: string): Promise<unknown> {
    return this.client.get(`/wallet/presentations/${id}/`, await this.token());
  }
}

export const presentationApi = new PresentationApi();
