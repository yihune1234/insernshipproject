import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, Shield, Calendar } from 'lucide-react';
import { getHolderVerificationHistory } from '../../api/holder';
import { formatDateTime, formatRelative } from '../../utils/formatDate';

export default function HolderVerificationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getHolderVerificationHistory()
      .then((r) => setHistory(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? history
    : filter === 'valid' ? history.filter((h) => h.is_valid)
    : history.filter((h) => !h.is_valid);

  const total = history.length;
  const valid = history.filter((h) => h.is_valid).length;
  const invalid = total - valid;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verification History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          A log of when your credentials were verified by third parties.
        </p>
      </div>

      {/* Summary cards */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Verifications', value: total, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Successful', value: valid, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Failed', value: invalid, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div className={`rounded-lg p-1.5 ${s.bg}`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        {[
          { key: 'all', label: 'All' },
          { key: 'valid', label: 'Successful' },
          { key: 'invalid', label: 'Failed' },
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground text-sm mb-1">No verifications yet</p>
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'Your credential verification history will appear here.'
              : `No ${filter === 'valid' ? 'successful' : 'failed'} verifications found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v, idx) => (
            <div key={v.id || idx} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 shrink-0 mt-0.5 ${
                  v.is_valid
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  {v.is_valid
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <XCircle className="h-4 w-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="font-medium text-sm text-foreground truncate">
                      {v.credential_type || v.credential_type_name || 'Credential'}
                    </p>
                    <span className={`shrink-0 text-xs font-medium ${v.is_valid ? 'text-green-600' : 'text-red-600'}`}>
                      {v.is_valid ? 'Valid' : 'Failed'}
                    </span>
                  </div>
                  {v.verifier_name && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Verified by: {v.verifier_name}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDateTime(v.verified_at || v.created_at)}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{formatRelative(v.verified_at || v.created_at)}</span>
                  </div>
                  {v.verification_method && (
                    <span className="inline-block mt-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {v.verification_method}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
