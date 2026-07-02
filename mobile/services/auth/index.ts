export { authApi } from './authApi';
export type { RegisterResponse, VerifyOTPResponse, LoginResponse, TokenRefreshResponse, UserProfileResponse } from './authApi';
export * from './holderAuth';
export * as LocalAuth from './localAuth';
export type { LocalAuthStatus } from './localAuth';

import { getAccessToken } from './holderAuth';

export const authService = {
  getToken: getAccessToken,
  getAccessToken,
};