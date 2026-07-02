import api from './axios';

// ─── Organization Registration (re-export from auth) ─────────────────────
import {
  registrationStep1 as _step1, registrationStep1Verify as _step1Verify,
  registrationStep2 as _step2, registrationStep3 as _step3,
  registrationStep4 as _step4, registrationStep5 as _step5,
} from './auth';

export const registrationStep1 = _step1;
export const registrationVerifyOTP = _step1Verify;
export const registrationStep2 = _step2;
export const registrationStep3 = _step3;
export const registrationStep4 = _step4;
export const registrationStep5 = _step5;

// ─── Organization Profile ───────────────────────────────────────────────────
export const getIssuerOrganization = () => api.get('/integration/organization/');

// ─── Integration Configuration ────────────────────────────────────────────────
export const getIntegrationConfigs = () => api.get('/integration/configs/');
export const getIntegrationConfig = (orgId) => api.get(`/integration/configs/${orgId}/`);
export const updateIntegrationConfig = (orgId, data) => api.put(`/integration/configs/${orgId}/`, data);
export const triggerIntegrationSync = (orgId) => api.post(`/integration/configs/${orgId}/sync/`);
export const checkIntegrationHealth = (orgId) => api.post(`/integration/configs/${orgId}/health/`);

// ─── Sync ─────────────────────────────────────────────────────────────────────
export const triggerLiveSync = (data) => api.post('/integration/sync/', data);
export const getSyncLogs = (params) => api.get('/integration/sync/logs/', { params });

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getIntegrationAnalytics = () => api.get('/integration/analytics/');
export const getOrgIntegrationAnalytics = (orgId) => api.get(`/integration/analytics/${orgId}/`);

// ─── Notifications ─────────────────────────────────────────────────────────
export const getIssuerUnreadCount = () => api.get('/integration/notifications/unread-count/');
export const getIssuerNotificationStream = (params) => api.get('/integration/notifications/stream/', { params });

// ─── Organization Profile (under main organizations app) ────────────────────
export const getOrganizationProfile = () => api.get('/organizations/profile/');
export const updateOrganizationProfile = (data) => api.put('/organizations/profile/', data);
export const uploadOrgLogo = (data) => api.post('/organizations/profile/logo/', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// ─── Members ───────────────────────────────────────────────────────────────────
export const getOrganizationMembers = () => api.get('/organizations/members/');
export const addOrganizationMember = (data) => api.post('/organizations/members/', data);
export const getOrganizationMember = (userId) => api.get(`/organizations/members/${userId}/`);
export const updateOrganizationMember = (userId, data) => api.put(`/organizations/members/${userId}/`, data);
export const removeOrganizationMember = (userId) => api.delete(`/organizations/members/${userId}/`);

// ─── Credential Issuance (new) ───────────────────────────────────────────────
export const issueCredential = (data) => api.post('/integration/credentials/', data);
export const bulkIssueCredentials = (data) => api.post('/integration/credentials/bulk/', data);
export const getIssuerCredentials = (params) => api.get('/integration/credentials/', { params });
export const updateCredentialStatus = (credentialId, data) => api.patch(`/integration/credentials/${credentialId}/status/`, data);

// ─── Member Check (new) ─────────────────────────────────────────────────────
export const checkMemberEligibility = (data) => api.post('/integration/members/check/', data);
export const getIssuerMembers = () => api.get('/integration/members/');

// ─── Org Members Management (new) ────────────────────────────────────────────
export const getOrganizationTeamMembers = () => api.get('/integration/organization/members/');
export const addOrganizationTeamMember = (data) => api.post('/integration/organization/members/', data);
export const removeOrganizationTeamMember = (userId) => api.delete(`/integration/organization/members/${userId}/`);
export const updateOrganizationTeamMemberRole = (userId, data) => api.patch(`/integration/organization/members/${userId}/`, data);

// ── Backward-compatible aliases ─────────────────────────────────────────────
export const triggerSync = triggerIntegrationSync;
export const getIssuerProfile = getOrganizationProfile;
export const updateIssuerProfile = updateOrganizationProfile;
export const getIssuerAuditLog = (params) => api.get('/audit/logs/', { params });
export const getIssuerNotifications = getIssuerNotificationStream;
export const markNotificationsRead = (data) => api.post('/notifications/mark-read/', data);
export const getIssuerAnalytics = getIntegrationAnalytics;
export const getIssuerDashboard = () => api.get('/integration/analytics/');
export const getIssuerAnalyticsStats = getIntegrationAnalytics;
export const getIssuerAnalyticsTrends = () => api.get('/integration/analytics/');
