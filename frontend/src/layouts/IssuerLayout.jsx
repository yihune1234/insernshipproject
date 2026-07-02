import { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard, Plug, RefreshCw,
  BarChart2, Bell, Settings, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import { getIssuerOrganization } from '../api/issuer';
import { useSSENotifications } from '../hooks/useSSENotifications';
import useAuthStore from '../store/authStore';

function StatusBanner({ orgStatus }) {
  if (orgStatus === 'pending' || orgStatus === 'under_review') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
        <span>
          Your organization is <strong>pending approval</strong>. Contact platform administrators for status.
        </span>
      </div>
    );
  }

  if (orgStatus === 'suspended') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 px-4 py-2 flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
        <span>
          Your organization account has been <strong>suspended</strong>. Contact support for assistance.
        </span>
      </div>
    );
  }

  return null;
}

export default function IssuerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgStatus, setOrgStatus] = useState(null);
  const [requestBadge, setRequestBadge] = useState(0);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    getIssuerOrganization()
      .then((r) => setOrgStatus(r.data?.status || 'active'))
      .catch(() => setOrgStatus('active'));
  }, []);

  const handleSSENotification = useCallback((payload) => {
    const { delta = 0, latest } = payload;
    if (delta > 0) {
      setRequestBadge((prev) => prev + delta);
      const title = latest?.title || 'New Holder Request';
      const message = latest?.message || `${delta} new credential request${delta !== 1 ? 's' : ''} received.`;
      toast(
        (t) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm">{title}</span>
            <span className="text-xs text-muted-foreground">{message}</span>
          </div>
        ),
        {
          icon: '📋',
          duration: 6000,
          style: { minWidth: '260px' },
        }
      );
    }
  }, []);

  const handleSSEConnect = useCallback((payload) => {
    setRequestBadge(0);
  }, []);

  useSSENotifications({
    onNotification: handleSSENotification,
    onConnect: handleSSEConnect,
    enabled: isAuthenticated,
  });

  const navItems = useMemo(() => [
    { to: '/issuer/dashboard',      label: 'Dashboard',       icon: LayoutDashboard, end: true },
    { to: '/issuer/integrations',   label: 'Integrations',    icon: Plug },
    { to: '/issuer/sync',           label: 'Synchronization', icon: RefreshCw },
    { to: '/issuer/members',        label: 'Members & Credentials', icon: Users },
    { to: '/issuer/analytics',      label: 'Analytics',       icon: BarChart2 },
    { to: '/issuer/notifications',  label: 'Notifications',   icon: Bell },
    { to: '/issuer/settings',       label: 'Settings',        icon: Settings },
  ], []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar navItems={navItems} logo="Issuer Portal" onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title="Issuer Portal" />
        <StatusBanner orgStatus={orgStatus} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
