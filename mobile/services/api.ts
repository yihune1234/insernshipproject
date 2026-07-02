export { ApiClient, ApiError, getApiConfig } from './api/index';
export * from './api/types';

// Auth
export { authApi } from './auth/authApi';
export type { RegisterResponse, VerifyOTPResponse, LoginResponse, TokenRefreshResponse, UserProfileResponse } from './auth/authApi';
export * from './auth/holderAuth';
export { authService } from './auth/index';

// Credentials
export { credentialApi } from './credentials/credentialApi';
export type { HolderCredentialRequestPayload, HolderRequestCatalogResponse } from './credentials/credentialApi';

// Presentation
export { presentationApi } from './presentation/presentationApi';

// Sharing
export { sharingApi } from './sharing/sharingApi';

// Verification
export { verificationApi } from './verification/verificationApi';

// NID
export { nidApi } from './nid/nidApi';

// Sync
export { syncData, saveSyncToken, addOfflineAction } from './sync/syncService';
