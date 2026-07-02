import api from './axios';

// ── Notifications (generic) ──────────────────────────────────────────────────
export const getNotifications = (params) => api.get('/notifications/', { params });
export const markNotificationsRead = (data) => api.post('/notifications/mark-read/', data);
export const markAllNotificationsRead = () => api.post('/notifications/mark-all-read/');
export const getNotificationPreferences = () => api.get('/notifications/preferences/');
export const updateNotificationPreferences = (data) => api.put('/notifications/preferences/', data);

// ── Role-specific (backward compat) ──────────────────────────────────────────
// Use generic endpoint for all roles; issuer has its own endpoints under /integration/
export const getUnreadCount = (role) => api.get('/notifications/unread-count/');
export const markRead = (role, id) => api.post('/notifications/mark-read/', { ids: [id] });
export const markAllRead = (role) => api.post('/notifications/mark-all-read/');
export const deleteNotification = (role, id) => api.delete(`/notifications/mark-read/`, { ids: [id] });
