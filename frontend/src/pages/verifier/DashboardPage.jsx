import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, History, Key, BarChart2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { getVerificationStats, getVerificationHistory } from '../../api/verifier';
import { formatDateTime } from '../../utils/formatDate';
import { CardSkeleton } from '../../components/common/SkeletonLoader';

export default function VerifierDashboard() {
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getVerificationStats(),
      getVerificationHistory({ page_size: 5 }),
    ]).then(([s, h]) => {
      setStats({
        total: s.data?.total_verifications || 0,
        valid: s.data?.valid_count || 0,
        invalid: s.data?.invalid_count || 0,
      });
      setRecent(h.data?.results || h.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verifier Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Verify and track credentials.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Verifications', value: stats.total, icon: ScanLine, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Valid', value: stats.valid, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Invalid', value: stats.invalid, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`rounded-lg p-2 ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            </div>
            <p className="text-3xl font-bold text-foreground">{loading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/verifier/verify', icon: ScanLine, label: 'Verify Credential', desc: 'Start a new verification' },
          { to: '/verifier/history', icon: History, label: 'History', desc: 'View all verifications' },
          { to: '/verifier/api-keys', icon: Key, label: 'API Keys', desc: 'Manage API access keys' },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors group">
            <div className="rounded-xl bg-primary/10 p-3 shrink-0"><a.icon className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Verifications</h2>
          <Link to="/verifier/history" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
          ) : recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No verifications yet.</p>
          ) : (
            recent.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm text-foreground">{v.credential_type || v.presentation_id?.slice(0, 8) || '—'}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(v.verified_at || v.created_at)}</p>
                </div>
                {v.is_valid
                  ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="h-3 w-3" />Valid</span>
                  : <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><XCircle className="h-3 w-3" />Invalid</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
