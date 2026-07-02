import { ApiClient, ApiError } from '../api/client';
import { getApiConfig } from '../api/config';

// ── Response types ──────────────────────────────────────────────────────────

export interface RegisterResponse {
  success: boolean;
  data: {
    user_id: string;
    message: string;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  data: {
    tokens: { access: string; refresh: string };
    user: {
      id: string; email: string; name: string; phone?: string;
      role: string; is_verified: boolean; national_id_verified: boolean;
    };
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    tokens: { access: string; refresh: string };
    user: {
      id: string; email: string; name: string; phone?: string;
      role: string; is_verified: boolean; national_id_verified: boolean;
    };
  };
}

export interface TokenRefreshResponse { access: string; refresh?: string; }

export interface UserProfileResponse {
  id: string; email: string; name: string; phone?: string;
  role: string; is_verified: boolean; national_id_verified: boolean; created_at: string;
}

// ── AuthApi class ────────────────────────────────────────────────────────────

class AuthApi {
  private readonly client: ApiClient;

  constructor() {
    this.client = new ApiClient(getApiConfig());
  }

  private async wrap<T>(call: () => Promise<T>): Promise<T> {
    try { return await call(); }
    catch (err) { if (err instanceof ApiError) throw err; throw err; }
  }

  /** POST /auth/register/ */
  async register(data: {
    name: string; email: string; password: string; phone?: string; role?: string;
  }): Promise<RegisterResponse> {
    return this.wrap(() =>
      this.client.post<RegisterResponse>('/auth/register/', data)
    );
  }

  /** POST /auth/register/verify-otp/ */
  async verifyOTP(userId: string, otp: string): Promise<VerifyOTPResponse> {
    return this.wrap(() =>
      this.client.post<VerifyOTPResponse>('/auth/register/verify-otp/', { user_id: userId, otp })
    );
  }

  /** POST /auth/login/ */
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.wrap(() =>
      this.client.post<LoginResponse>('/auth/login/', { email, password })
    );
  }

  /** POST /auth/token/refresh/ */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    return this.wrap(() =>
      this.client.post<TokenRefreshResponse>('/auth/token/refresh/', { refresh: refreshToken })
    );
  }

  /** GET /auth/me/ */
  async getProfile(accessToken: string): Promise<UserProfileResponse> {
    return this.wrap(() => this.client.get<UserProfileResponse>('/auth/me/', accessToken));
  }

  /** PUT /auth/me/ */
  async updateProfile(accessToken: string, data: { name?: string; phone?: string }): Promise<UserProfileResponse> {
    return this.wrap(() => this.client.put<UserProfileResponse>('/auth/me/', data, accessToken));
  }

  /** POST /auth/logout/ */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    try { await this.client.post('/auth/logout/', { refresh: refreshToken }, accessToken); }
    catch (e) { /* fire-and-forget */ }
  }

  /** POST /auth/password/reset/ */
  async requestPasswordReset(email: string): Promise<void> {
    return this.wrap(() => this.client.post('/auth/password/reset/', { email }));
  }

  /** POST /auth/password/reset/confirm/ */
  async confirmPasswordReset(email: string, otp: string, newPassword: string): Promise<void> {
    return this.wrap(() =>
      this.client.post('/auth/password/reset/confirm/', { email, otp, new_password: newPassword })
    );
  }

  /** POST /auth/me/password/ */
  async changePassword(accessToken: string, currentPassword: string, newPassword: string): Promise<void> {
    return this.wrap(() =>
      this.client.post('/auth/me/password/', {
        current_password: currentPassword, new_password: newPassword,
      }, accessToken)
    );
  }

  /** GET /wallet/ */
  async getWallets(accessToken: string) {
    return this.wrap(() => this.client.get<unknown>('/wallet/', accessToken));
  }

  /** GET /did/ */
  async getDIDs(accessToken: string) {
    return this.wrap(() => this.client.get<unknown[]>('/did/', accessToken));
  }
}

export const authApi = new AuthApi();
