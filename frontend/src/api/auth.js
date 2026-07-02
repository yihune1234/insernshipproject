import api from './axios';

// ── Core auth ──────────────────────────────────────────────────────────────────
export const login = (credentials) => api.post('/auth/login/', credentials);
export const logout = (data) => api.post('/auth/logout/', data);
export const getMe = () => api.get('/auth/me/');
export const updateMe = (data) => api.put('/auth/me/', data);
export const refreshToken = (data) => api.post('/auth/token/refresh/', data);

// ── Registration ───────────────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register/', data);
export const verifyRegistrationOtp = (data) => api.post('/auth/register/verify-otp/', data);

// ── Password ───────────────────────────────────────────────────────────────────
export const forgotPassword = (data) => api.post('/auth/password/reset/', data);
export const resetPassword = (data) => api.post('/auth/password/reset/confirm/', data);
export const changePassword = (data) => api.post('/auth/me/password/', data);

// ── National ID (Fayda) ────────────────────────────────────────────────────────
export const nidInitiate = (data) => api.post('/national-id/initiate/', data);
export const nidConfirm = (data) => api.post('/national-id/confirm/', data);
export const nidGetProfile = () => api.get('/national-id/status/');

// ── DID-based auth ─────────────────────────────────────────────────────────────
export const didAuthChallenge = (data) => api.post('/did/auth/challenge/', data);
export const didAuthRespond = (data) => api.post('/did/auth/respond/', data);

// ── Organization registration ──────────────────────────────────────────────────
export const registrationStep1 = (data) => api.post('/organizations/register/step-1/', data);
export const registrationStep1Verify = (data) => api.post('/organizations/register/step-1/verify/', data);
export const registrationStep2 = (data) => api.post('/organizations/register/step-2/', data);
export const registrationStep3 = (data, config) => api.post('/organizations/register/step-3/', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
  ...config,
});
export const registrationStep4 = (data) => api.post('/organizations/register/step-4/', data);
export const registrationStep5 = (data) => api.post('/organizations/register/step-5/', data);
export const getRegistrationStatus = (pk) => api.get(`/organizations/register/status/${pk}/`);
export const getOrganizationTypes = () => api.get('/organizations/types/');

// ── Backward-compatible aliases ─────────────────────────────────────────────
export const nidVerifyOtp = nidConfirm;
export const registerWebHolder = register;
