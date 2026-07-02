import { useEffect, useState, useCallback } from 'react';
import {
  Network, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Settings, X, Search, UserCheck,
  UserX, ShieldCheck, Loader2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getIntegrationConfigs, updateIntegrationConfig,
  checkIntegrationHealth, triggerLiveSync,
  checkMemberEligibility, issueCredential,
} from '../../api/issuer';
import { formatDate, formatRelative } from '../../utils/formatDate';
import useIssuerStore from '../../store/issuerStore';

/* ── helpers ── */
function HealthDot({ h }) {
  const c = { healthy: 'bg-green-500', degraded: 'bg-yellow-500', unreachable: 'bg-red-500' }[h] || 'bg-gray-400';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${c}`} />;
}
function HealthLabel({ h }) {
  const m = { healthy: 'text-green-600', degraded: 'text-yellow-600', unreachable: 'text-red-600' }[h] || 'text-gray-500';
  return <span className={`text-xs font-medium capitalize ${m}`}>{h || 'unknown'}</span>;
}

/* ── Settings Modal ── */
function SettingsModal({ config, onClose, onSaved }) {
  const [form, setForm] = useState({
    base_url: config.base_url || '',
    auth_type: config.auth_type || 'bearer_token',
    api_key: '',
    api_key_header_name: config.api_key_header_name || 'Authorization',
    sync_enabled: config.sync_enabled,
    sync_interval_minutes: config.sync_interval_minutes || 60,
    timeout_seconds: config.timeout_seconds || 30,
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.api_key) delete payload.api_key;
      await updateIntegrationConfig(config.organization, payload);
      toast.success('Integration settings saved');
      onSaved();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.errors;
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Integration Settings</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">External API Base URL</label>
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="http://localhost:3001"
              value={form.base_url}
              onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">Root URL of the organization's member API</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Auth Type</label>
              <select
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                value={form.auth_type}
                onChange={e => setForm(f => ({ ...f, auth_type: e.target.value }))}
              >
                <option value="bearer_token">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="basic_auth">Basic Auth</option>
                <option value="custom_header">Custom Header</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Header Name</label>
              <input
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                placeholder="Authorization"
                value={form.api_key_header_name}
                onChange={e => setForm(f => ({ ...f, api_key_header_name: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">API Key / Token (leave blank to keep current)</label>
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
              type="password"
              placeholder="••••••••"
              value={form.api_key}
              onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Sync Interval (minutes)</label>
              <input
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                type="number" min="5" max="10080"
                value={form.sync_interval_minutes}
                onChange={e => setForm(f => ({ ...f, sync_interval_minutes: parseInt(e.target.value) || 60 }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Timeout (seconds)</label>
              <input
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                type="number" min="5" max="300"
                value={form.timeout_seconds}
                onChange={e => setForm(f => ({ ...f, timeout_seconds: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="sync_enabled"
              type="checkbox"
              checked={form.sync_enabled}
              onChange={e => setForm(f => ({ ...f, sync_enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="sync_enabled" className="text-sm text-foreground">Auto-sync enabled</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Member Check Panel ── */
function MemberCheckPanel({ config }) {
  const [nid, setNid] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [issuing, setIssuing] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!nid.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await checkMemberEligibility({ national_id: nid.trim() });
      setResult(res.data);
    } catch (err) {
      const msg = err?.response?.data?.errors || 'Check failed';
      toast.error(typeof msg === 'string' ? msg : 'Member check failed');
    } finally { setChecking(false); }
  };

  const handleIssue = async () => {
    if (!result?.is_member) return;
    setIssuing(true);
    try {
      await issueCredential({
        credential_id: `${config.organization}-${nid}-${Date.now()}`,
        national_id: nid,
        credential_type: 'Organization Membership',
        title: `${config.organization_name} — Membership Certificate`,
        data: {
          full_name: result.full_name,
          email: result.email,
          org_name: result.org_name || config.organization_name,
          department: result.department,
          checked_at: new Date().toISOString(),
        },
        issued_at: new Date().toISOString(),
      });
      toast.success('Credential issued successfully!');
      setResult(prev => ({ ...prev, existing_credential: { status: 'active', credential_type: 'Organization Membership' } }));
    } catch (err) {
      const msg = err?.response?.data?.errors || 'Issuance failed';
      toast.error(typeof msg === 'string' ? msg : 'Failed to issue credential');
    } finally { setIssuing(false); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check Member &amp; Issue Credential</p>
      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="National ID (e.g. NID-1234567890)"
          value={nid}
          onChange={e => setNid(e.target.value)}
        />
        <button
          type="submit" disabled={checking || !nid.trim()}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 flex items-center gap-1"
        >
          {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          Check
        </button>
      </form>

      {result && (
        <div className={`rounded-lg border p-3 text-xs space-y-2 ${result.is_member ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
          <div className="flex items-center gap-2">
            {result.is_member
              ? <UserCheck className="h-4 w-4 text-green-600" />
              : <UserX className="h-4 w-4 text-red-600" />}
            <span className={`font-semibold ${result.is_member ? 'text-green-700' : 'text-red-700'}`}>
              {result.is_member ? 'Member verified in external system' : result.detail || 'Not a member'}
            </span>
          </div>

          {result.is_member && (
            <div className="grid grid-cols-2 gap-1 text-muted-foreground">
              {result.full_name && <span><strong>Name:</strong> {result.full_name}</span>}
              {result.email && <span><strong>Email:</strong> {result.email}</span>}
              {result.department && <span><strong>Dept:</strong> {result.department}</span>}
              {result.org_name && <span><strong>Org:</strong> {result.org_name}</span>}
            </div>
          )}

          {result.platform_holder && (
            <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Platform holder found: <strong>{result.platform_holder.name}</strong></span>
            </div>
          )}

          {result.existing_credential && (
            <div className="text-muted-foreground">
              Existing credential: <strong className="capitalize">{result.existing_credential.status}</strong>
              {result.existing_credential.issued_at && ` · issued ${formatDate(result.existing_credential.issued_at)}`}
            </div>
          )}

          {result.is_member && !result.existing_credential && (
            <button
              onClick={handleIssue} disabled={issuing}
              className="mt-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-1"
            >
              {issuing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
              Issue Credential
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function IntegrationsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [checkingHealth, setCheckingHealth] = useState({});
  const [editingConfig, setEditingConfig] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { setIntegrations } = useIssuerStore();

  const loadConfigs = useCallback(() => {
    setLoading(true);
    getIntegrationConfigs()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setConfigs(data);
        setIntegrations(data);
        if (data.length === 1) setExpandedId(data[0].id);
      })
      .catch(() => { toast.error('Failed to load integrations'); setConfigs([]); })
      .finally(() => setLoading(false));
  }, [setIntegrations]);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const handleSync = async (orgId) => {
    setSyncing(p => ({ ...p, [orgId]: true }));
    try {
      const res = await triggerLiveSync({ org_id: orgId });
      const r = res.data;
      toast.success(`Sync done — ${r.created} new, ${r.updated} updated, ${r.failed} failed`, { duration: 6000 });
      loadConfigs();
    } catch (err) {
      const msg = err?.response?.data?.errors || 'Sync failed';
      toast.error(typeof msg === 'string' ? msg : 'Sync failed');
    } finally { setSyncing(p => ({ ...p, [orgId]: false })); }
  };

  const handleHealth = async (orgId) => {
    setCheckingHealth(p => ({ ...p, [orgId]: true }));
    try {
      const res = await checkIntegrationHealth(orgId);
      toast.success(`Health: ${res.data?.health}`);
      loadConfigs();
    } catch { toast.error('Health check failed'); }
    finally { setCheckingHealth(p => ({ ...p, [orgId]: false })); }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2].map(i => <div key={i} className="card h-40 bg-muted/30" />)}
    </div>
  );

  const healthy = configs.filter(c => c.connection_health === 'healthy').length;
  const issues = configs.filter(c => ['degraded','unreachable'].includes(c.connection_health)).length;

  return (
    <div className="space-y-6">
      {editingConfig && (
        <SettingsModal
          config={editingConfig}
          onClose={() => setEditingConfig(null)}
          onSaved={loadConfigs}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Organization Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect your external member system, sync credentials, and verify holders.</p>
      </div>

      {configs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: configs.length, color: 'text-blue-600' },
            { label: 'Healthy', value: healthy, color: 'text-green-600' },
            { label: 'Issues', value: issues, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {configs.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <Network className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-sm font-medium text-foreground">No integrations configured</p>
            <p className="text-xs text-muted-foreground mt-1">Contact your admin to link an external organization API.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map(config => (
            <div key={config.id} className="card border border-border overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">{config.organization_name}</h3>
                    <HealthDot h={config.connection_health} />
                    <HealthLabel h={config.connection_health} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      config.sync_status === 'success' ? 'bg-green-100 text-green-700' :
                      config.sync_status === 'error'   ? 'bg-red-100 text-red-700' :
                                                         'bg-gray-100 text-gray-600'
                    }`}>
                      {config.sync_status || 'idle'}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Last sync: {config.last_sync_at ? formatRelative(config.last_sync_at) : '—'}</span>
                    <span>Interval: {config.sync_interval_minutes}m</span>
                    {config.consecutive_failures > 0 && (
                      <span className="text-orange-600">{config.consecutive_failures} failure{config.consecutive_failures !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {config.base_url && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate max-w-xs">{config.base_url}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSync(config.organization)}
                    disabled={syncing[config.organization]}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncing[config.organization] ? 'animate-spin' : ''}`} />
                    {syncing[config.organization] ? 'Syncing…' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => handleHealth(config.organization)}
                    disabled={checkingHealth[config.organization]}
                    className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-60 flex items-center gap-1"
                  >
                    {checkingHealth[config.organization]
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Checking…</>
                      : <><CheckCircle2 className="h-3 w-3" />Health</>}
                  </button>
                  <button
                    onClick={() => setEditingConfig(config)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
                  >
                    <Settings className="h-3 w-3" /> Settings
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === config.id ? null : config.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
                  >
                    <Search className="h-3 w-3" />
                    {expandedId === config.id ? 'Hide' : 'Check Member'}
                  </button>
                </div>
              </div>

              {/* Expandable member check */}
              {expandedId === config.id && (
                <div className="px-4 pb-4">
                  <MemberCheckPanel config={config} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-foreground mb-1">How Integration Works</h3>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Click <strong>Settings</strong> to set your org's external API URL and credentials.</li>
          <li>Click <strong>Sync Now</strong> to pull all members and create credentials automatically.</li>
          <li>Use <strong>Check Member</strong> to look up a specific holder by National ID and issue a single credential.</li>
          <li>Click <strong>Health</strong> to verify the external API is reachable.</li>
        </ol>
      </div>
    </div>
  );
}
