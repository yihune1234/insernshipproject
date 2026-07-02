import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Network, Activity, Users, AlertTriangle, 
  CheckCircle2, XCircle, RefreshCw, TrendingUp,
} from 'lucide-react';
import { 
  getIntegrationAnalytics, 
  getIntegrationConfigs,
  getIssuerOrganization 
} from '../../api/issuer';
import { StatusBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { formatDate } from '../../utils/formatDate';

function HealthIndicator({ health }) {
  const map = {
    'healthy': { icon: CheckCircle2, color: 'text-green-500', label: 'Healthy', bg: 'bg-green-50 dark:bg-green-900/20' },
    'degraded': { icon: AlertTriangle, color: 'text-yellow-500', label: 'Degraded', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    'unreachable': { icon: XCircle, color: 'text-red-500', label: 'Unreachable', bg: 'bg-red-50 dark:bg-red-900/20' },
    'unknown': { icon: AlertTriangle, color: 'text-gray-400', label: 'Unknown', bg: 'bg-gray-50 dark:bg-gray-900/20' },
  };
  const config = map[health] || map['unknown'];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span>{config.label}</span>
    </div>
  );
}

export default function IssuerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getIntegrationAnalytics().catch(() => ({})),
      getIntegrationConfigs().catch(() => ({ data: [] })),
      getIssuerOrganization().catch(() => ({})),
    ]).then(([analyticsRes, configsRes, orgRes]) => {
      setAnalytics(analyticsRes.data || {});
      setConfigs(Array.isArray(configsRes.data) ? configsRes.data : []);
      setOrg(orgRes.data || null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;

  const statCards = [
    {
      label: 'Total Integrations',
      value: analytics?.total_integrations ?? 0,
      icon: Network,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      href: '/issuer/integrations',
    },
    {
      label: 'Healthy Connections',
      value: analytics?.healthy_connections ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Active Holders',
      value: analytics?.active_holders ?? 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Synchronized Credentials',
      value: analytics?.total_credentials ?? 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Issuer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Organization integration status and credential synchronization.</p>
        </div>
        <Link to="/issuer/integrations">
          <button className="btn-primary text-sm px-4 py-2 rounded-lg flex items-center gap-2">
            <Network className="h-4 w-4" /> Manage Integrations
          </button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} to={s.href || '#'} className="card p-4 hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Organization Status */}
      {org && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Organization Status</h2>
            <StatusBadge status={org.status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Organization Name</p>
              <p className="font-medium text-foreground">{org.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Organization Type</p>
              <p className="font-medium text-foreground">{org.org_type?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium text-foreground capitalize">{org.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connected Organizations / Integrations */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Connected Organizations</h2>
          <Link to="/issuer/integrations" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        
        {configs.length === 0 ? (
          <div className="text-center py-8">
            <Network className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No integrations configured yet.</p>
            <Link to="/issuer/integrations" className="text-sm text-primary hover:underline mt-1 inline-block">
              Set up your first integration →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-4 font-medium">Organization</th>
                  <th className="pb-2 pr-4 font-medium">Health</th>
                  <th className="pb-2 pr-4 font-medium">Last Sync</th>
                  <th className="pb-2 pr-4 font-medium">Next Sync</th>
                  <th className="pb-2 font-medium">Sync Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {configs.slice(0, 5).map((config) => (
                  <tr key={config.id}>
                    <td className="py-2.5 pr-4 font-medium">{config.organization_name}</td>
                    <td className="py-2.5 pr-4"><HealthIndicator health={config.connection_health} /></td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                      {config.last_sync_at ? formatDate(config.last_sync_at) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                      {config.next_sync_at ? formatDate(config.next_sync_at) : '—'}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        config.sync_status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        config.sync_status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {config.sync_status === 'success' && <CheckCircle2 className="h-3 w-3" />}
                        {config.sync_status === 'error' && <XCircle className="h-3 w-3" />}
                        {config.sync_status === 'syncing' && <RefreshCw className="h-3 w-3 animate-spin" />}
                        {(config.sync_status || 'idle').charAt(0).toUpperCase() + (config.sync_status || 'idle').slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Sync Activity */}
      {analytics?.recent_sync_stats && analytics.recent_sync_stats.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-foreground mb-4">Recent Sync Activity</h2>
          <div className="space-y-2">
            {analytics.recent_sync_stats.slice(0, 5).map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{stat.organization__name}</p>
                  <p className="text-xs text-muted-foreground">{stat.total_syncs} sync{stat.total_syncs !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{stat.total_processed} credentials</p>
                  <p className="text-xs text-muted-foreground">processed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
