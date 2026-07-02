import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';
import { authService } from '../auth';

class NidApi {
  private client: ApiClient;
  constructor() { this.client = new ApiClient(getApiConfig()); }

  private async token(): Promise<string> {
    const t = await authService.getToken();
    if (!t) throw new Error('Not authenticated');
    return t;
  }

  // POST /national-id/initiate/
  async initiate(fin: string): Promise<unknown> {
    return this.client.post('/national-id/initiate/', { fin });
  }

  // POST /national-id/confirm/
  async confirm(sessionId: string, otp: string): Promise<unknown> {
    return this.client.post('/national-id/confirm/', { session_id: sessionId, otp });
  }

  // GET /national-id/status/
  async getStatus(): Promise<unknown> {
    return this.client.get('/national-id/status/', await this.token());
  }

  // GET /national-id/status/ (alias for getProfile)
  async getProfile(): Promise<unknown> {
    return this.getStatus();
  }
}

export const nidApi = new NidApi();
