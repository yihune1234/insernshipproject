import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function AdminReports() {
  const [syncReport, setSyncReport] = useState(null);
  const [orgReport, setOrgReport] = useState(null);
  const [verificationReport, setVerificationReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin-portal/reports/synchronization/').catch(() => ({})),
      api.get('/admin-portal/reports/organizations/').catch(() => ({})),
      api.get('/admin-portal/reports/verifications/').catch(() => ({})),
    ])
      .then(([sync, org, verify]) => {
        setSyncReport(sync.data?.data || sync.data);
        setOrgReport(org.data?.data || org.data);
        setVerificationReport(verify.data?.data || verify.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const statCards = [
    { label: 'Total Syncs', value: syncReport?.total_syncs },
    { label: 'Successful Syncs', value: syncReport?.successful },
    { label: 'Organizations', value: orgReport?.total_organizations },
    { label: 'Verifications', value: verificationReport?.total },
  ];

  // Chart data for synchronization trends
  const syncData = syncReport?.by_status ? Object.entries(syncReport.by_status).map(([status, count]) => ({
    name: status,
    value: count,
  })) : [];

  // Organization status distribution
  const orgData = orgReport?.by_status ? Object.entries(orgReport.by_status).map(([status, count]) => ({
    name: status,
    value: count,
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Platform Reports</h1>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
            {loading ? <div className="h-8 bg-muted animate-pulse rounded" /> : (
              <p className="text-3xl font-bold text-foreground">{s.value ?? '—'}</p>
            )}
          </div>
        ))}
      </div>

      {syncData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Synchronization Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={syncData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {syncData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {orgData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Organization Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orgData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Synchronization Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Processed:</span>
              <span className="font-medium">{syncReport?.total_processed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed Syncs:</span>
              <span className="font-medium text-red-600">{syncReport?.failed || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Organization Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved:</span>
              <span className="font-medium">{orgReport?.approved || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suspended:</span>
              <span className="font-medium text-orange-600">{orgReport?.suspended || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Verification Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="font-medium text-green-600">{verificationReport?.success_rate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed:</span>
              <span className="font-medium text-red-600">{verificationReport?.failed || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
