import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';
import { authService } from '../auth';

class VerificationApi {
  private client: ApiClient;
  constructor() { this.client = new ApiClient(getApiConfig()); }

  private async token(): Promise<string> {
    const t = await authService.getToken();
    if (!t) throw new Error('Not authenticated');
    return t;
  }

  // POST /verification/verify/
  async verifyCredential(credentialId: string): Promise<unknown> {
    return this.client.post('/verification/verify/', { credential_id: credentialId }, await this.token());
  }

  // POST /verification/public/verify/
  async verifyCredentialPublic(credentialId: string): Promise<unknown> {
    return this.client.post('/verification/public/verify/', { credential_id: credentialId });
  }

  // GET /verification/history/
  async getVerificationHistory(): Promise<unknown[]> {
    return this.client.get<unknown[]>('/verification/history/', await this.token());
  }

  // GET /verification/history/{id}/
  async getVerificationHistoryItem(id: string): Promise<unknown> {
    return this.client.get(`/verification/history/${id}/`, await this.token());
  }

  // GET /verification/history/{id}/ — alias for verification-result screen
  async getVerificationResult(id: string): Promise<unknown> {
    return this.client.get(`/verification/history/${id}/`, await this.token());
  }
}

export const verificationApi = new VerificationApi();
