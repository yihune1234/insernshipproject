import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getVerificationAnalytics, getVerificationTrends } from '../../api/verifier';
import { CardSkeleton } from '../../components/common/SkeletonLoader';

export default function VerifierAnalytics() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getVerificationAnalytics(), getVerificationTrends()])
      .then(([s, t]) => {
        setSummary(s.data);
        setTrends(t.data?.results || t.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Verifications', value: summary?.total_verifications },
          { label: 'Valid Rate', value: summary?.valid_rate ? `${(summary.valid_rate * 100).toFixed(1)}%` : undefined },
          { label: 'Avg / Day', value: summary?.avg_per_day },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
            {loading ? <div className="h-8 bg-muted animate-pulse rounded" /> : (
              <p className="text-3xl font-bold text-foreground">{s.value ?? '—'}</p>
            )}
          </div>
        ))}
      </div>

      {trends.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Verification Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Verifications" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
