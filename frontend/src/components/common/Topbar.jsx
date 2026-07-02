import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';
import useAuthStore from '../../store/authStore';

export default function Topbar({ onMenuClick, title }) {
  const { toggle, isDark } = useTheme();
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-md p-1.5 hover:bg-accent transition-colors lg:hidden">
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        {title && <h1 className="text-sm font-semibold text-foreground hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors">
          {isDark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}
