import { ApiClient } from '../api/client';
import { getApiConfig } from '../api/config';

export interface ShareCredentialRequest {
  credential_id: string;
  disclosed_claims?: string[];
  expires_in_hours?: number;
}
export interface ShareCredentialResponse { share_token: string; share_url: string; qr_code: string; }

class SharingApi {
  private client: ApiClient;
  constructor() { this.client = new ApiClient(getApiConfig()); }

  // POST /wallet/shares/enable/
  async enableSharing(request: ShareCredentialRequest): Promise<ShareCredentialResponse> {
    return this.client.post('/wallet/shares/enable/', request);
  }

  // POST /wallet/shares/enable/ — simplified for QR display
  async shareCredential(credentialId: string): Promise<{ success: boolean; data: { shareUrl: string; qrToken: string; expiresAt: string } }> {
    const res = await this.client.post<{ share_token: string; share_url: string; qr_code: string }>('/wallet/shares/enable/', {
      credential_id: credentialId,
      disclosed_claims: [],
      expires_in_hours: 1,
    });
    return {
      success: true,
      data: {
        shareUrl: res.share_url,
        qrToken: res.share_token,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    };
  }

  // POST /wallet/shares/disable/
  async disableSharing(credentialId: string): Promise<{ message: string }> {
    return this.client.post('/wallet/shares/disable/', { credential_id: credentialId });
  }

  // GET /wallet/shares/stats/
  async getShareStats(): Promise<unknown> {
    return this.client.get('/wallet/shares/stats/');
  }
}

export const sharingApi = new SharingApi();
