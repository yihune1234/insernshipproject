import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, BadgeCheck, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { getAdminDashboard, getPlatformStats } from '../../api/admin';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { formatDateTime } from '../../utils/formatDate';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((r) => setStats(r.data))
      .catch(() => getPlatformStats().then((r) => setStats(r.data)).catch(() => {}))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Organizations', value: stats?.total_organizations, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', to: '/admin/organizations' },
    { label: 'Active Organizations', value: stats?.active_organizations, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', to: '/admin/organizations' },
    { label: 'Total Holders', value: stats?.total_holders, icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', to: '/admin/holders' },
    { label: 'Synchronized Credentials', value: stats?.synchronized_credentials, icon: BadgeCheck, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', to: '/admin/credentials' },
    { label: 'Verification Requests', value: stats?.verification_requests, icon: CheckCircle, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', to: '/admin/verifications' },
    { label: 'Failed Synchronizations', value: stats?.failed_synchronizations, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', to: '/admin/integrations' },
  ];

  const quickLinks = [
    { to: '/admin/organizations/pending', icon: Building2, label: 'Pending Organizations', desc: 'Review organization registrations' },
    { to: '/admin/integrations', icon: CheckCircle, label: 'Integration Monitor', desc: 'Check synchronization status' },
    { to: '/admin/holders', icon: Users, label: 'Holder Management', desc: 'Monitor synchronized holders' },
    { to: '/admin/audit-logs', icon: TrendingUp, label: 'Audit Logs', desc: 'Track all platform activity' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform management overview. Monitor organizations, credentials, integrations, and verification activity.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.slice(0, 6).map((s) => (
          <Link key={s.label} to={s.to} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`rounded-lg p-2 ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            </div>
            {loading ? <div className="h-8 bg-muted animate-pulse rounded" /> : (
              <p className="text-3xl font-bold text-foreground">{s.value ?? '—'}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((a) => (
          <Link key={a.to} to={a.to} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors group">
            <div className="rounded-xl bg-primary/10 p-2 shrink-0"><a.icon className="h-4 w-4 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {stats.recent_activity.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <p className="text-sm text-foreground">{a.description || a.action}</p>
                <span className="text-xs text-muted-foreground">{formatDateTime(a.timestamp || a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
