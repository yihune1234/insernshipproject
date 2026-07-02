import api from './axios';

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getAdminDashboard = () => api.get('/admin-portal/dashboard/');

// ── Users ──────────────────────────────────────────────────────────────────────
export const getAdminUsers = () => api.get('/admin-portal/users/');
export const getAdminUser = (id) => api.get(`/admin-portal/users/${id}/`);
export const suspendUser = (id) => api.post(`/admin-portal/users/${id}/suspend/`);
export const activateUser = (id) => api.post(`/admin-portal/users/${id}/activate/`);

// ── Organizations (admin-portal) ──────────────────────────────────────────────
export const getAdminOrganizations = () => api.get('/admin-portal/organizations/');
export const getPendingOrganizations = () => api.get('/admin-portal/organizations/pending/');
export const getAdminOrganization = (id) => api.get(`/admin-portal/organizations/${id}/`);
export const approveOrganization = (id) => api.post(`/admin-portal/organizations/${id}/approve/`);
export const rejectOrganization = (id, data) => api.post(`/admin-portal/organizations/${id}/reject/`, data);

// ── Integration Monitoring ─────────────────────────────────────────────────────
export const getAdminIntegrations = () => api.get('/admin-portal/integrations/');
export const getAdminIntegration = (id) => api.get(`/admin-portal/integrations/${id}/`);
export const retryIntegration = (id) => api.post(`/admin-portal/integrations/${id}/retry/`);
export const disableIntegration = (id) => api.post(`/admin-portal/integrations/${id}/disable/`);

// ── Credentials ────────────────────────────────────────────────────────────────
export const getAdminSynchronizedCredentials = () => api.get('/admin-portal/credentials/synchronized/');
export const getAdminCredentialStatus = () => api.get('/admin-portal/credentials/status/');

// ── Holders ────────────────────────────────────────────────────────────────────
export const getAdminHolders = () => api.get('/admin-portal/holders/');

// ── Verifications ──────────────────────────────────────────────────────────────
export const getAdminVerificationLogs = (params) => api.get('/admin-portal/verifications/logs/', { params });
export const getAdminVerificationStats = () => api.get('/admin-portal/verifications/stats/');
export const getAdminRevokedCredentials = () => api.get('/admin-portal/verifications/revoked/');
export const getAdminExpiredCredentials = () => api.get('/admin-portal/verifications/expired/');

// ── Reports ────────────────────────────────────────────────────────────────────
export const getSynchronizationReport = (params) => api.get('/admin-portal/reports/synchronization/', { params });
export const getOrganizationReport = (params) => api.get('/admin-portal/reports/organizations/', { params });
export const getVerificationReport = (params) => api.get('/admin-portal/reports/verifications/', { params });
export const getIntegrationReport = (params) => api.get('/admin-portal/reports/integrations/', { params });
export const getAuditReport = (params) => api.get('/admin-portal/reports/audit/', { params });

// ── Trust Registry ─────────────────────────────────────────────────────────────
export const getTrustAccreditations = () => api.get('/trust/accreditations/');
export const getAccreditation = (id) => api.get(`/trust/accreditations/${id}/`);
export const approveAccreditation = (id) => api.post(`/trust/accreditations/${id}/approve/`);
export const suspendAccreditation = (id) => api.post(`/trust/accreditations/${id}/suspend/`);
export const checkTrust = (orgId) => api.get(`/trust/check/${orgId}/`);

// ── Backward-compatible aliases ─────────────────────────────────────────────
export const getPlatformStats = getAdminDashboard;
export const reactivateUser = activateUser;
export const getOrgDetail = getAdminOrganization;
export const approveOrg = approveOrganization;
export const rejectOrg = rejectOrganization;
export const suspendOrg = (id) => api.post(`/admin-portal/users/${id}/suspend/`);
export const reactivateOrg = (id) => api.post(`/admin-portal/users/${id}/activate/`);
export const getAllOrgs = getAdminOrganizations;
export const getPendingOrgs = getPendingOrganizations;
export const getPendingRegistrations = getPendingOrganizations;
export const getPendingRegistration = getPendingOrganizations;
export const getRegistrationDocuments = (id) => api.get(`/admin-portal/organizations/${id}/`);
export const approveRegistration = approveOrganization;
export const rejectRegistration = rejectOrganization;
export const getAdminVerifications = getAdminVerificationLogs;
export const getAdminCredentials = getAdminSynchronizedCredentials;
export const getAdminNotifications = () => api.get('/admin-portal/dashboard/');
export const markAdminNotificationRead = (id) => api.post('/notifications/mark-read/', { ids: [id] });
export const markAllAdminNotificationsRead = () => api.post('/notifications/mark-all-read/');
export const getTrustRegistryIssuers = getTrustAccreditations;
export const getTrustRegistryVerifiers = getTrustAccreditations;
export const getAuditLogs = () => api.get('/audit/logs/');
export const getAdminProfile = () => api.get('/admin-portal/dashboard/');
export const updateAdminProfile = (data) => api.put('/auth/me/', data);
export const changeAdminPassword = (data) => api.post('/auth/me/password/', data);
