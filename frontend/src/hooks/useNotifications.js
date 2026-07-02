import { useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore';
import { getUnreadCount, getNotifications, markRead, markAllRead, deleteNotification } from '../api/notifications';
import { NOTIFICATION_POLL_INTERVAL } from '../utils/constants';

const stores = {
  holder: () => import('../store/holderStore').then((m) => m.default),
  issuer: () => import('../store/issuerStore').then((m) => m.default),
  verifier: () => import('../store/verifierStore').then((m) => m.default),
  admin: () => import('../store/adminStore').then((m) => m.default),
};

const useNotifications = () => {
  const { role, isAuthenticated } = useAuthStore();

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated || !role || role === 'admin') return;
    try {
      const res = await getUnreadCount(role);
      const storeModule = await stores[role]?.();
      if (storeModule) storeModule.getState().setUnreadCount(res.data?.unread_count || 0);
    } catch { /* ignore */ }
  }, [role, isAuthenticated]);

  const fetchNotifications = useCallback(async (params) => {
    if (!isAuthenticated || !role) return [];
    try {
      let res;
      if (role === 'admin') {
        const { getAdminNotifications } = await import('../api/admin');
        res = await getAdminNotifications(params);
      } else {
        res = await getNotifications(params);
      }
      const storeModule = await stores[role]?.();
      const data = res.data?.results || res.data || [];
      if (storeModule) storeModule.getState().setNotifications(data);
      return data;
    } catch { return []; }
  }, [role, isAuthenticated]);

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, NOTIFICATION_POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchCount]);

  return { fetchCount, fetchNotifications, markRead: (id) => markRead(role, id), markAllRead: () => markAllRead(role), deleteNotification: (id) => deleteNotification(role, id) };
};

export default useNotifications;
