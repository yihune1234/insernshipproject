import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CreditCard, Filter, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import { getHolderCredentials } from '../../api/holder';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { formatDate } from '../../utils/formatDate';
import useDebounce from '../../hooks/useDebounce';

const STATUS_TABS = [
  { key: '', label: 'All', icon: CreditCard },
  { key: 'active', label: 'Active', icon: ShieldCheck },
  { key: 'expired', label: 'Expired', icon: AlertTriangle },
  { key: 'revoked', label: 'Revoked', icon: XCircle },
];

const STATUS_COLORS = {
  active: 'from-green-500 to-emerald-600',
  revoked: 'from-red-500 to-rose-600',
  expired: 'from-yellow-500 to-amber-600',
  default: 'from-primary to-primary/80',
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, page_size: 12 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;

    getHolderCredentials(params)
      .then((r) => {
        const data = r.data;
        const results = data?.results || data || [];
        const count = data?.count || results.length;
        setCredentials(results);
        setTotalCount(count);
        setTotalPages(Math.ceil(count / 12));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleTabChange = (key) => {
    setStatusFilter(key);
    setPage(1);
  };

  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Credentials</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount} credential{totalCount !== 1 ? 's' : ''}
              {statusFilter ? ` (${statusFilter})` : ''}
            </p>
          )}
        </div>
        <Link to="/holder/credentials/request">
          <Button size="sm">
            <Plus className="h-4 w-4" />Request
          </Button>
        </Link>
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={handleSearch} placeholder="Search by type, issuer…" />

      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              statusFilter === t.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 h-36">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={search ? 'No credentials match your search' : statusFilter ? `No ${statusFilter} credentials` : 'No credentials yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Request a credential from an issuer to get started.'
          }
          action={
            !search && (
              <Link to="/holder/credentials/request">
                <Button size="sm"><Plus className="h-4 w-4" />Request Credential</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {credentials.map((c) => {
              const gradient = STATUS_COLORS[c.status] || STATUS_COLORS.default;
              return (
                <Link
                  key={c.id}
                  to={`/holder/credentials/${c.id}`}
                  className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all group"
                >
                  {/* Colored top strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                      {c.credential_type_name || c.type || 'Credential'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3 truncate">
                      Issued by {c.issuer_name || '—'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Issued: {formatDate(c.issued_at || c.issuanceDate)}</span>
                      {c.expiration_date && (
                        <span className={c.status === 'expired' ? 'text-yellow-600 font-medium' : ''}>
                          Exp: {formatDate(c.expiration_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
