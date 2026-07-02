import { useEffect, useState } from 'react';
import { getTrustRegistryIssuers, getTrustRegistryVerifiers } from '../../api/admin';
import Table from '../../components/common/Table';
import { StatusBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';

export default function TrustRegistryPage() {
  const [issuers, setIssuers] = useState([]);
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('issuers');

  useEffect(() => {
    Promise.all([getTrustRegistryIssuers(), getTrustRegistryVerifiers()])
      .then(([i, v]) => {
        setIssuers(i.data?.results || i.data || []);
        setVerifiers(v.data?.results || v.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const issuerColumns = [
    { key: 'issuer_name', label: 'Issuer', render: (v) => <span className="font-medium">{v || '—'}</span> },
    { key: 'credential_type_name', label: 'Credential Type' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'accredited_at', label: 'Accredited', render: (v) => formatDate(v) },
    { key: 'expires_at', label: 'Expires', render: (v) => v ? formatDate(v) : '—' },
  ];

  const verifierColumns = [
    { key: 'verifier_name', label: 'Verifier', render: (v) => <span className="font-medium">{v || '—'}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'authorized_at', label: 'Authorized', render: (v) => formatDate(v) },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Trust Registry</h1>

      <div className="flex gap-2 rounded-xl bg-muted p-1 w-fit">
        {[{ id: 'issuers', label: `Issuers (${issuers.length})` }, { id: 'verifiers', label: `Verifiers (${verifiers.length})` }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'issuers' && (
        <Table columns={issuerColumns} data={issuers} loading={loading} emptyMessage="No issuer accreditations." />
      )}
      {tab === 'verifiers' && (
        <Table columns={verifierColumns} data={verifiers} loading={loading} emptyMessage="No verifier authorizations." />
      )}
    </div>
  );
}
