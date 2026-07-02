import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, Share2, ClipboardList, ArrowRight, ShieldCheck,
  Bell, Fingerprint, Activity, Plus, RefreshCw, Key,
} from 'lucide-react';
import {
  getHolderCredentials,
  getHolderNotifications,
  getHolderNotificationCount,
} from '../../api/holder';
import { StatusBadge } from '../../components/common/Badge';
import { formatDate, formatRelative } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';
import { CardSkeleton } from '../../components/common/SkeletonLoader';

export default function HolderDashboard() {
  const { user } = useAuthStore();
  const [credentials, setCredentials] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [credsRes, notifRes, countRes] = await Promise.allSettled([
        getHolderCredentials({ page_size: 6 }),
        getHolderNotifications({ limit: 5 }),
        getHolderNotificationCount(),
      ]);
      if (credsRes.status === 'fulfilled') {
        const d = credsRes.value.data;
        setCredentials(d?.results || d || []);
      }
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data?.results || notifRes.value.data || []);
      }
      if (countRes.status === 'fulfilled') {
        setUnreadCount(countRes.value.data?.unread_count || 0);
      }
    } catch { }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = credentials.filter((c) => c.status === 'active').length;
  const expired = credentials.filter((c) => c.status === 'expired').length;
  const revoked = credentials.filter((c) => c.status === 'revoked').length;

  const identity = user?.identity;
  const displayName = identity?.full_name
    || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null)
    || user?.email?.split('@')[0]
    || 'Holder';

  const did = user?.did || identity?.did || '';

  const statCards = [
    { label: 'Total', value: credentials.length, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: CreditCard },
    { label: 'Active', value: active, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: ShieldCheck },
    { label: 'Expired', value: expired, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: ClipboardList },
    { label: 'Revoked', value: revoked, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: Activity },
  ];

  const quickActions = [
    { to: '/holder/credentials/request', icon: Plus, label: 'Request Credential', desc: 'Ask an issuer' },
    { to: '/holder/credentials', icon: ShieldCheck, label: 'My Credentials', desc: 'View & manage all' },
    { to: '/holder/shares', icon: Share2, label: 'Shared Links', desc: 'Manage shares' },
    { to: '/holder/presentations', icon: Fingerprint, label: 'Presentations', desc: 'Verifiable proofs' },
  ];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {displayName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your digital credential wallet.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-lg p-2 hover:bg-muted/50 transition-colors text-muted-foreground disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/holder/notifications"
            className="relative rounded-lg p-2 hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground shadow-md">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-primary-foreground/60 text-[10px] font-semibold uppercase tracking-widest">
              Digital Identity
            </p>
            <h2 className="text-lg font-bold mt-0.5">{displayName}</h2>
            {user?.national_id && (
              <p className="text-primary-foreground/75 text-sm mt-0.5">
                NID: {user.national_id}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-primary-foreground/15 p-2.5">
            <Fingerprint className="h-6 w-6" />
          </div>
        </div>

        {did && (
          <div className="rounded-lg bg-primary-foreground/10 px-3 py-2 mb-3">
            <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wide mb-0.5">DID</p>
            <p className="font-mono text-xs text-primary-foreground/85 truncate">{did}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xs text-primary-foreground/75">
            {user?.national_id_verified ? 'Identity Verified · ' : 'Wallet Active · '}
            {credentials.length} credential{credentials.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className={`rounded-lg p-1.5 ${s.bg}`}>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/30 hover:shadow-sm transition-all group"
          >
            <div className="rounded-xl bg-primary/10 p-2.5 shrink-0 group-hover:bg-primary/20 transition-colors">
              <a.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column: credentials + notifications */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Recent credentials */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">Recent Credentials</h2>
            <Link to="/holder/credentials" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : credentials.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No credentials yet.{' '}
                <Link to="/holder/credentials/request" className="text-primary hover:underline">
                  Request one →
                </Link>
              </div>
            ) : (
              credentials.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  to={`/holder/credentials/${c.id}`}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <CreditCard className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {c.credential_type_name || c.type || 'Credential'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.issuer_name || '—'} · {formatDate(c.issued_at || c.issuanceDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <StatusBadge status={c.status} />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground text-sm">Notifications</h2>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            <Link to="/holder/notifications" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const notif = n.notification || n;
                const isUnread = !n.is_read && n.status !== 'read';
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3.5 ${isUnread ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {notif.title || notif.message || 'Notification'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelative(notif.created_at || n.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom links */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {
            to: '/holder/requests',
            icon: ClipboardList,
            label: 'Credential Requests',
            desc: 'Track pending & approved requests',
          },
          {
            to: '/holder/verification-history',
            icon: Activity,
            label: 'Verification History',
            desc: 'See when your credentials were verified',
          },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors group"
          >
            <div className="rounded-xl bg-muted p-3 shrink-0">
              <a.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
