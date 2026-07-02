import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Plus, ClipboardList,
  Share2, History, Bell, Settings, Wallet, Presentation,
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

const navItems = [
  { to: '/holder/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/holder/credentials', label: 'My Credentials', icon: CreditCard },
  { to: '/holder/credentials/request', label: 'Request Credential', icon: Plus },
  { to: '/holder/requests', label: 'My Requests', icon: ClipboardList },
  { to: '/holder/presentations', label: 'Presentations', icon: Presentation },
  { to: '/holder/shares', label: 'Shared Links', icon: Share2 },
  { to: '/holder/verification-history', label: 'History', icon: History },
  { to: '/holder/notifications', label: 'Notifications', icon: Bell },
  { to: '/holder/settings', label: 'Settings', icon: Settings },
];

export default function HolderLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar – desktop always visible, mobile toggleable */}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar navItems={navItems} logo="Holder Portal" onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title="Holder Portal" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
