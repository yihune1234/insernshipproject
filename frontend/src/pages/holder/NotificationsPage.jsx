import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, BellOff, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getHolderNotifications,
  markHolderNotificationRead,
  markAllHolderNotificationsRead,
  deleteHolderNotification,
} from '../../api/holder';
import { formatRelative, formatDateTime } from '../../utils/formatDate';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const NOTIF_ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
};

const NOTIF_COLOR = {
  info: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

function NotificationItem({ item, onMarkRead, onDelete }) {
  const notif = item.notification || item;
  const isRead = item.is_read || item.status === 'read';
  const type = notif.notification_type || 'info';
  const Icon = NOTIF_ICON[type] || Bell;
  const iconColor = NOTIF_COLOR[type] || 'text-muted-foreground';

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
        !isRead ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-sm ${!isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground'} truncate`}>
              {notif.title || notif.message || 'Notification'}
            </p>
            {notif.body && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1.5" title={formatDateTime(notif.created_at || item.created_at)}>
              {formatRelative(notif.created_at || item.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isRead && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onMarkRead(item.id)}
                title="Mark as read"
                className="h-7 w-7"
              >
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(item.id)}
              title="Delete"
              className="h-7 w-7"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
            </Button>
          </div>
        </div>
      </div>
      {!isRead && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );
}

export default function HolderNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    getHolderNotifications({ limit: 50 })
      .then((r) => setNotifications(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await markHolderNotificationRead(id);
      setNotifications((n) =>
        n.map((x) => x.id === id ? { ...x, is_read: true, status: 'read' } : x)
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAll = async () => {
    try {
      await markAllHolderNotificationsRead();
      setNotifications((n) => n.map((x) => ({ ...x, is_read: true, status: 'read' })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const remove = async (id) => {
    try {
      await deleteHolderNotification(id);
      setNotifications((n) => n.filter((x) => x.id !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const unread = notifications.filter((n) => !n.is_read && n.status !== 'read').length;
  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.is_read && n.status !== 'read')
    : notifications;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAll}>
            <Check className="h-4 w-4" />Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unread})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              filter === t.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground text-sm mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === 'unread'
              ? "You've read everything!"
              : "Notifications about your credentials will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <NotificationItem
              key={n.id}
              item={n}
              onMarkRead={markRead}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
