import api from './axios';

// ── Profile ────────────────────────────────────────────────────────────────────
export const getVerifierProfile = () => api.get('/verifier/api-keys/');

// ── Verification ──────────────────────────────────────────────────────────────
export const createVerification = (data) => api.post('/verification/verify/', data);
export const getVerificationHistory = () => api.get('/verification/history/');
export const getVerificationHistoryItem = (id) => api.get(`/verification/history/${id}/`);

// ── Public verification ────────────────────────────────────────────────────────
export const verifyPublic = (data) => api.post('/verification/public/verify/', data);

// ── Verifier Portal ────────────────────────────────────────────────────────────
export const getVerifierVerify = (data) => api.post('/verifier/verify/', data);
export const getVerifierAnalytics = () => api.get('/verifier/analytics/');

// ── API Keys ───────────────────────────────────────────────────────────────────
export const getApiKeys = () => api.get('/verifier/api-keys/');
export const createApiKey = (data) => api.post('/verifier/api-keys/', data);
export const getApiKey = (id) => api.get(`/verifier/api-keys/${id}/`);
export const updateApiKey = (id, data) => api.put(`/verifier/api-keys/${id}/`, data);
export const deleteApiKey = (id) => api.delete(`/verifier/api-keys/${id}/`);
export const rotateApiKey = (id) => api.post(`/verifier/api-keys/${id}/rotate/`);

// ── Verifier Registration ──────────────────────────────────────────────────────
export const registerVerifier = (data) => api.post('/verifier/register/', data);

// ── Backward-compatible aliases ─────────────────────────────────────────────
export const updateVerifierProfile = (data) => api.put('/auth/me/', data);
export const getVerifierDashboard = getVerifierAnalytics;
export const getVerification = getVerificationHistoryItem;
export const getVerificationStats = () => api.get('/verifier/analytics/');
export const getVerificationTrends = () => api.get('/verifier/analytics/');
export const getVerificationAnalytics = getVerifierAnalytics;
export const getOrgApiKeys = getApiKeys;
export const createOrgApiKey = createApiKey;
export const deleteOrgApiKey = deleteApiKey;
export const getVerifierNotifications = (params) => api.get('/notifications/', { params });
export const getVerifierNotificationCount = () => api.get('/notifications/unread-count/');
export const markVerifierNotificationRead = (id) => api.post('/notifications/mark-read/', { ids: [id] });
export const markAllVerifierNotificationsRead = () => api.post('/notifications/mark-all-read/');
export const deleteVerifierNotification = (id) => api.post('/notifications/mark-read/', { ids: [id] });
