import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, BadgeCheck, CheckCircle,
  ShieldCheck, FileText, Bell, Settings, BookOpen, BarChart2,
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/holders', label: 'Holders', icon: Users },
  { to: '/admin/integrations', label: 'Integrations', icon: BadgeCheck },
  { to: '/admin/credentials', label: 'Credentials', icon: FileText },
  { to: '/admin/verifications', label: 'Verifications', icon: CheckCircle },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: BookOpen },
  { to: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar navItems={navItems} logo="Admin Portal" onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title="Admin Portal" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
