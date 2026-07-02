import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { formatRelative } from '../../utils/formatDate';
import useNotifications from '../../hooks/useNotifications';
import useAuthStore from '../../store/authStore';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const { role } = useAuthStore();
  const { fetchNotifications, markRead, markAllRead, deleteNotification, fetchCount } = useNotifications();

  const load = async () => {
    const data = await fetchNotifications({ page_size: 10 });
    setNotifications(data);
    const cnt = data.filter((n) => !n.is_read).length;
    setUnread(cnt);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Check className="h-3 w-3" />Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    {!n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    {n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground line-clamp-2">{n.title || n.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
                    </div>
                    <div className="flex gap-1">
                      {!n.is_read && (
                        <button onClick={() => handleMarkRead(n.id)} className="rounded p-1 hover:bg-accent">
                          <Check className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)} className="rounded p-1 hover:bg-accent">
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
