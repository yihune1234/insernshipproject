import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from '../../api/admin';
import { formatRelative } from '../../utils/formatDate';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminNotifications()
      .then((r) => setNotifications(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try { await markAdminNotificationRead(id); setNotifications((n) => n.map((x) => x.id === id ? { ...x, is_read: true } : x)); } catch { }
  };
  const markAll = async () => {
    try { await markAllAdminNotificationsRead(); setNotifications((n) => n.map((x) => ({ ...x, is_read: true }))); toast.success('All read'); } catch { }
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notifications {unread > 0 && <span className="text-sm text-muted-foreground font-normal">({unread} unread)</span>}</h1>
        {unread > 0 && <Button size="sm" variant="outline" onClick={markAll}><Check className="h-4 w-4" />Mark all read</Button>}
      </div>
      {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center"><Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No notifications</p></div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 rounded-xl border bg-card p-4 ${!n.is_read ? 'bg-primary/5 border-primary/20' : 'border-border'}`}>
              {!n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              {n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{n.title || n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.created_at)}</p>
              </div>
              {!n.is_read && <Button size="icon" variant="ghost" onClick={() => markRead(n.id)}><Check className="h-4 w-4 text-muted-foreground" /></Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
