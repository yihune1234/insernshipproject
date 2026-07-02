import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import * as authApi from '../api/auth';
import { getRoleRedirect } from '../utils/roleRedirect';

export const useAuth = () => {
  const { user, role, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const resp = res.data?.data || res.data;
    const tokens = resp.tokens || resp;
    const access = tokens.access || tokens.token;
    const refresh = tokens.refresh;
    const userData = resp.user || {};
    const userRole = userData.role;

    if (!access || !refresh || !userRole) {
      console.error('Invalid login response:', { access, refresh, userRole, resp });
      throw new Error('Invalid login response from server');
    }

    setAuth({ user: userData, role: userRole, access, refresh });
    toast.success('Logged in successfully');
    const redirectPath = getRoleRedirect(userRole);
    navigate(redirectPath, { replace: true });
    return res.data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    storeLogout();
    toast.success('Logged out');
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      useAuthStore.getState().setUser(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isAuthenticated) refreshUser();
  }, [isAuthenticated]);

  return { user, role, isAuthenticated, login, logout, refreshUser };
};
