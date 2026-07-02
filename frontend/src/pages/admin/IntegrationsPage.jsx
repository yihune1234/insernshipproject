import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, RefreshCw, Pause } from 'lucide-react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';
import api from '../../api/axios';

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = () => {
    setLoading(true);
    api.get('/admin-portal/integrations/')
      .then((r) => {
        setIntegrations(r.data?.data || r.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleRetry = async (orgId) => {
    try {
      await api.post(`/admin-portal/integrations/${orgId}/retry/`);
      loadIntegrations();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleDisable = async (orgId) => {
    if (!window.confirm('Disable integration for this organization?')) return;
    try {
      await api.post(`/admin-portal/integrations/${orgId}/disable/`);
      loadIntegrations();
    } catch (err) {
      console.error('Disable failed:', err);
    }
  };

  const columns = [
    {
      key: 'organization_name',
      label: 'Organization',
      render: (v, row) => (
        <Link to={`/admin/organizations/${row.organization_id}`} className="font-medium text-primary hover:underline">
          {v}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Connection Status',
      render: (v) => (
        <div className="flex items-center gap-2">
          {v === 'connected' ? (
            <><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-green-600">Connected</span></>
          ) : (
            <><AlertCircle className="h-4 w-4 text-red-600" /><span className="text-red-600">Disconnected</span></>
          )}
        </div>
      ),
    },
    {
      key: 'sync_status',
      label: 'Sync Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'credentials_processed',
      label: 'Processed',
      render: (v) => v ?? '—',
    },
    {
      key: 'last_sync',
      label: 'Last Sync',
      render: (v) => v ? formatDate(v) : '—',
    },
    {
      key: 'organization_id',
      label: 'Actions',
      render: (v) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleRetry(v)}
            className="p-1 hover:bg-muted rounded transition"
            title="Retry synchronization"
          >
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </button>
          <button
            onClick={() => handleDisable(v)}
            className="p-1 hover:bg-muted rounded transition"
            title="Disable integration"
          >
            <Pause className="h-4 w-4 text-orange-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integration Monitor</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor credential synchronization status and manage integrations.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Connected</p>
          <p className="text-3xl font-bold text-green-600">
            {integrations.filter(i => i.status === 'connected').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Disconnected</p>
          <p className="text-3xl font-bold text-red-600">
            {integrations.filter(i => i.status === 'disconnected').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Credentials Processed</p>
          <p className="text-3xl font-bold text-blue-600">
            {integrations.reduce((sum, i) => sum + (i.credentials_processed || 0), 0)}
          </p>
        </div>
      </div>

      <Table columns={columns} data={integrations} loading={loading} emptyMessage="No integrations found." />
    </div>
  );
}
