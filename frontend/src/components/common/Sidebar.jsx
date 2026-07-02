import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ navItems = [], logo, collapsed, onClose }) {
  const { logout, user } = useAuth();

  return (
    <aside className={clsx(
      'flex h-full flex-col bg-card border-r border-border',
      collapsed ? 'w-16' : 'w-64',
      'transition-all duration-200'
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border shrink-0">
        {!collapsed && <span className="font-bold text-primary text-sm">{logo || 'CredWallet'}</span>}
        {onClose && (
          <button onClick={onClose} className="rounded p-1 hover:bg-accent lg:hidden">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && item.badge > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.first_name || user?.email || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          <button onClick={logout} className="rounded p-1 hover:bg-accent transition-colors" title="Logout">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}
