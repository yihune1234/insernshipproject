import { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, ShieldCheck, ShieldX, RefreshCw,
  Loader2, UserCheck, UserX, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getIssuerCredentials, updateCredentialStatus,
  checkMemberEligibility, issueCredential,
  getIntegrationConfigs,
} from '../../api/issuer';
import { formatDate, formatRelative } from '../../utils/formatDate';

function StatusBadge({ status }) {
  const map = {
    active:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    pending_match: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    revoked:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    suspended:     'bg-orange-100 text-orange-700',
    expired:       'bg-gray-100 text-gray-600',
  };
  const icon = { active: CheckCircle2, revoked: XCircle, pending_match: Clock }[status];
  const Icon = icon || Clock;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      <Icon className="h-3 w-3" />
      {status?.replace('_', ' ')}
    </span>
  );
}

export default function MembersPage() {
  const [credentials, setCredentials] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // member check state
  const [nid, setNid] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [issuing, setIssuing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [credsRes, cfgsRes] = await Promise.all([
        getIssuerCredentials().catch(() => ({ data: [] })),
        getIntegrationConfigs().catch(() => ({ data: [] })),
      ]);
      setCredentials(Array.isArray(credsRes.data) ? credsRes.data : []);
      setConfigs(Array.isArray(cfgsRes.data) ? cfgsRes.data : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!nid.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const r = await checkMemberEligibility({ national_id: nid.trim() });
      setCheckResult(r.data);
    } catch (err) {
      const msg = err?.response?.data?.errors || 'Check failed';
      toast.error(typeof msg === 'string' ? msg : 'Member check failed');
    } finally { setChecking(false); }
  };

  const handleIssue = async () => {
    if (!checkResult?.is_member) return;
    const orgName = configs[0]?.organization_name || 'Organization';
    const orgId = configs[0]?.organization;
    setIssuing(true);
    try {
      await issueCredential({
        credential_id: `manual-${nid}-${Date.now()}`,
        national_id: nid.trim(),
        credential_type: 'Organization Membership',
        title: `${orgName} — Membership Certificate`,
        data: {
          full_name: checkResult.full_name,
          email: checkResult.email,
          org_name: checkResult.org_name || orgName,
          department: checkResult.department,
          issued_manually: true,
        },
        issued_at: new Date().toISOString(),
      });
      toast.success('Credential issued!');
      setCheckResult(prev => ({
        ...prev,
        existing_credential: { status: 'active', credential_type: 'Organization Membership' },
      }));
      loadData();
    } catch (err) {
      const msg = err?.response?.data?.errors || 'Issue failed';
      toast.error(typeof msg === 'string' ? msg : 'Failed to issue credential');
    } finally { setIssuing(false); }
  };

  const handleRevoke = async (credentialId) => {
    if (!window.confirm('Revoke this credential?')) return;
    try {
      await updateCredentialStatus(credentialId, { status: 'revoked', reason: 'Revoked by issuer' });
      toast.success('Credential revoked');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.errors || 'Revoke failed');
    }
  };

  const filtered = credentials.filter(c => {
    const q = filter.toLowerCase();
    const matchQ = !q || c.national_id?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) || c.credential_type?.toLowerCase().includes(q);
    const matchS = !statusFilter || c.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Members &amp; Credentials</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Check member eligibility from your external system and manage issued credentials.
        </p>
      </div>

      {/* Member Check Card */}
      <div className="card p-5 border border-primary/20 bg-primary/5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          Check Member Eligibility &amp; Issue Credential
        </h2>
        <form onSubmit={handleCheck} className="flex gap-2 mb-3">
          <input
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter National ID (e.g. NID-1234567890)"
            value={nid}
            onChange={e => setNid(e.target.value)}
          />
          <button
            type="submit"
            disabled={checking || !nid.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Check
          </button>
        </form>

        {checkResult && (
          <div className={`rounded-lg border p-4 text-sm space-y-3 ${
            checkResult.is_member
              ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
              : 'border-red-200 bg-red-50 dark:bg-red-900/10'
          }`}>
            <div className="flex items-center gap-2">
              {checkResult.is_member
                ? <UserCheck className="h-5 w-5 text-green-600" />
                : <UserX className="h-5 w-5 text-red-600" />}
              <span className={`font-semibold ${checkResult.is_member ? 'text-green-700' : 'text-red-700'}`}>
                {checkResult.is_member ? 'Verified member of external system' : checkResult.detail || 'Not a member'}
              </span>
            </div>

            {checkResult.is_member && (
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                {checkResult.full_name && <div><strong className="text-foreground">Name:</strong> {checkResult.full_name}</div>}
                {checkResult.email && <div><strong className="text-foreground">Email:</strong> {checkResult.email}</div>}
                {checkResult.department && <div><strong className="text-foreground">Dept:</strong> {checkResult.department}</div>}
                {checkResult.org_name && <div><strong className="text-foreground">Org:</strong> {checkResult.org_name}</div>}
                {checkResult.status && <div><strong className="text-foreground">Status:</strong> {checkResult.status}</div>}
              </div>
            )}

            {checkResult.platform_holder ? (
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
                <span>Platform account found: <strong>{checkResult.platform_holder.name}</strong> ({checkResult.platform_holder.email})</span>
              </div>
            ) : checkResult.is_member && (
              <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 px-3 py-2 rounded-lg">
                <ShieldX className="h-4 w-4" />
                <span>No platform account yet — credential will be <strong>pending_match</strong> until holder registers</span>
              </div>
            )}

            {checkResult.existing_credential ? (
              <div className="text-xs text-muted-foreground">
                Already has credential: <StatusBadge status={checkResult.existing_credential.status} />
                {checkResult.existing_credential.issued_at && (
                  <span className="ml-1">· issued {formatDate(checkResult.existing_credential.issued_at)}</span>
                )}
              </div>
            ) : checkResult.is_member && (
              <button
                onClick={handleIssue}
                disabled={issuing}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Issue Credential
              </button>
            )}
          </div>
        )}
      </div>

      {/* Credentials Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Synced Credentials ({credentials.length})
          </h2>
          <div className="flex gap-2">
            <input
              className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background text-foreground w-44"
              placeholder="Search NID or type…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <select
              className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background text-foreground"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending_match">Pending Match</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
            <button onClick={loadData} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-muted/40 rounded" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {credentials.length === 0
                ? 'No credentials yet. Use Sync or check a member above.'
                : 'No results match your filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-4 font-medium">National ID</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Issued</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(cred => (
                  <tr key={cred.id}>
                    <td className="py-2.5 pr-4 font-mono text-xs">{cred.national_id || '—'}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">{cred.credential_type || '—'}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={cred.status} /></td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs whitespace-nowrap">
                      {cred.issued_at ? formatRelative(cred.issued_at) : '—'}
                    </td>
                    <td className="py-2.5">
                      {cred.status === 'active' && (
                        <button
                          onClick={() => handleRevoke(cred.credential_id)}
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
