import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, History, Key, BarChart2, Bell, Settings,
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

const navItems = [
  { to: '/verifier/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/verifier/verify', label: 'Verify', icon: ScanLine },
  { to: '/verifier/history', label: 'History', icon: History },
  { to: '/verifier/api-keys', label: 'API Keys', icon: Key },
  { to: '/verifier/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/verifier/notifications', label: 'Notifications', icon: Bell },
  { to: '/verifier/settings', label: 'Settings', icon: Settings },
];

export default function VerifierLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar navItems={navItems} logo="Verifier Portal" onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title="Verifier Portal" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
