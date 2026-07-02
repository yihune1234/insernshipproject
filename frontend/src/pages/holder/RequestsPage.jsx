import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Plus, Clock, CheckCircle2,
  XCircle, Package, RefreshCw, AlertCircle,
} from 'lucide-react';
import { getHolderRequests } from '../../api/holder';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { formatRelative } from '../../utils/formatDate';

const POLL_MS = 30_000;

const STATUS_META = {
  pending:  { Icon: Clock,        bg: 'bg-yellow-50 dark:bg-yellow-900/20',  text: 'text-yellow-600 dark:text-yellow-400' },
  approved: { Icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-900/20',    text: 'text-green-600 dark:text-green-400'   },
  issued:   { Icon: Package,      bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-600 dark:text-blue-400'     },
  rejected: { Icon: XCircle,      bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-600 dark:text-red-400'       },
};

function RequestCard({ req }) {
  const meta = STATUS_META[req.status] || STATUS_META.pending;
  const { Icon, bg, text } = meta;
  const isPending = req.status === 'pending';

  return (
    <div className={`rounded-xl border bg-card p-4 transition-all ${isPending ? 'border-yellow-200 dark:border-yellow-800' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 shrink-0 mt-0.5 ${bg}`}>
          <Icon className={`h-4 w-4 ${text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium text-sm text-foreground truncate">
              {req.credential_type_name || req.credential_type || 'Credential Request'}
            </p>
            <StatusBadge status={req.status} />
          </div>

          {(req.organization_name || req.issuer_name) && (
            <p className="text-xs text-muted-foreground mb-1">
              Issuer: <span className="text-foreground">{req.organization_name || req.issuer_name}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
            <span>Requested {formatRelative(req.created_at)}</span>
            {req.updated_at && req.updated_at !== req.created_at && (
              <span>· Updated {formatRelative(req.updated_at)}</span>
            )}
          </div>

          {/* Rejection reason */}
          {req.status === 'rejected' && req.rejection_reason && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">{req.rejection_reason}</p>
            </div>
          )}

          {/* Issuer note on approved */}
          {req.status === 'approved' && req.issuer_note && (
            <div className="mt-2 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-2">
              <p className="text-xs text-green-700 dark:text-green-400">Note: {req.issuer_note}</p>
            </div>
          )}

          {/* Link to issued credential */}
          {req.status === 'issued' && req.credential_id && (
            <Link
              to={`/holder/credentials/${req.credential_id}`}
              className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
            >
              <Package className="h-3 w-3" />View issued credential →
            </Link>
          )}

          {/* Pending: show waiting indicator */}
          {isPending && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs text-muted-foreground">Waiting for issuer review</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HolderRequestsPage() {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('');
  const [lastLoaded, setLastLoaded] = useState(null);
  const pollRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await getHolderRequests();
      setRequests(r.data?.results || r.data || []);
      setLastLoaded(new Date());
    } catch { /* silent */ }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  const filtered = filter ? requests.filter(r => r.status === filter) : requests;

  const tabs = [
    { key: '',         label: 'All',      count: requests.length },
    { key: 'pending',  label: 'Pending',  count: requests.filter(r => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length },
    { key: 'issued',   label: 'Issued',   count: requests.filter(r => r.status === 'issued').length },
    { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your credential requests.
            {lastLoaded && (
              <span className="ml-2 text-xs text-muted-foreground/60">
                Auto-refreshes every 30 s
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => load()} className="gap-1 text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Link to="/holder/credentials/request">
            <Button size="sm"><Plus className="h-4 w-4" />New Request</Button>
          </Link>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
              filter === t.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filter === t.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground text-sm mb-1">No requests</p>
          <p className="text-sm text-muted-foreground mb-4">
            {filter ? `No ${filter} requests found.` : "You haven't made any credential requests yet."}
          </p>
          <Link to="/holder/credentials/request">
            <Button size="sm"><Plus className="h-4 w-4" />Request a Credential</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => <RequestCard key={req.id} req={req} />)}
        </div>
      )}
    </div>
  );
}
