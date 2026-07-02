import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts';
import {
  getIntegrationAnalytics, 
  getOrgIntegrationAnalytics,
  getIntegrationConfigs,
} from '../../api/issuer';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { formatDate } from '../../utils/formatDate';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [orgAnalytics, setOrgAnalytics] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getIntegrationAnalytics().catch(() => ({})),
      getIntegrationConfigs().catch(() => ({ data: [] })),
    ]).then(([analyticsRes, configsRes]) => {
      setAnalytics(analyticsRes.data || {});
      const configsList = Array.isArray(configsRes.data) ? configsRes.data : [];
      setConfigs(configsList);
      if (configsList.length > 0) {
        setSelectedOrgId(configsList[0].organization);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      getOrgIntegrationAnalytics(selectedOrgId)
        .then((r) => {
          const raw = r.data;
          setOrgAnalytics(Array.isArray(raw) ? raw : []);
        })
        .catch(() => setOrgAnalytics([]));
    }
  }, [selectedOrgId]);

  if (loading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  // Prepare org sync stats for chart
  const syncTrendData = (analytics?.recent_sync_stats || []).map((stat) => ({
    org: stat.organization__name?.slice(0, 15) || 'Unknown',
    syncs: stat.total_syncs,
    credentials: stat.total_processed,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integration Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Synchronization statistics and integration health.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Integrations', value: analytics?.total_integrations ?? 0, color: 'text-blue-600' },
          { label: 'Healthy', value: analytics?.healthy_connections ?? 0, color: 'text-green-600' },
          { label: 'Active Holders', value: analytics?.active_holders ?? 0, color: 'text-purple-600' },
          { label: 'Credentials Synced', value: analytics?.total_credentials ?? 0, color: 'text-indigo-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Org Sync Trend */}
      {syncTrendData.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Sync Activity by Organization</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={syncTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="org" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="credentials" fill="#6366f1" name="Credentials Processed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Organization Details */}
      {configs.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Sync History</h2>
            <select
              value={selectedOrgId || ''}
              onChange={(e) => setSelectedOrgId(e.target.value || null)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground"
            >
              {configs.map((cfg) => (
                <option key={cfg.id} value={cfg.organization}>
                  {cfg.organization_name}
                </option>
              ))}
            </select>
          </div>

          {orgAnalytics.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No sync history for this organization.</p>
          ) : (
            <div className="space-y-2">
              {orgAnalytics.slice(0, 10).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {log.sync_type?.charAt(0).toUpperCase() + log.sync_type?.slice(1) || 'Sync'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(log.started_at)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-2 text-xs font-medium">
                      <span className={log.status === 'completed' ? 'text-green-600' : 'text-red-600'}>
                        {log.status?.charAt(0).toUpperCase() + log.status?.slice(1)}
                      </span>
                      <span className="text-muted-foreground">
                        {log.processed}/{log.created + log.updated}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
