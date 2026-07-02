import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, PauseCircle } from 'lucide-react';
import { getOrgDetail, approveOrg, rejectOrg, suspendOrg, reactivateOrg } from '../../api/admin';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import { FullPageSpinner } from '../../components/common/Spinner';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function AdminOrganizationDetail() {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [reason, setReason] = useState('');

  const load = () => {
    getOrgDetail(id)
      .then((r) => setOrg(r.data))
      .catch(() => toast.error('Failed to load organization'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const act = async (action) => {
    setActing(action);
    try {
      if (action === 'approve') { await approveOrg(id, {}); toast.success('Approved'); }
      else if (action === 'reject') { await rejectOrg(id, { reason }); toast.success('Rejected'); }
      else if (action === 'suspend') { await suspendOrg(id, { reason }); toast.success('Suspended'); }
      else if (action === 'reactivate') { await reactivateOrg(id); toast.success('Reactivated'); }
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    } finally { setActing(null); }
  };

  if (loading) return <FullPageSpinner />;
  if (!org) return <div className="py-16 text-center text-muted-foreground">Organization not found.</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/admin/organizations"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button></Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{org.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{org.org_type} organization</p>
          </div>
          <StatusBadge status={org.registration_status} />
        </div>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium text-foreground">{org.email || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium text-foreground">{org.phone || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Website</dt><dd className="font-medium text-foreground">{org.website || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Registration #</dt><dd className="font-medium text-foreground">{org.registration_number || '—'}</dd></div>
          <div><dt className="text-muted-foreground">Submitted</dt><dd className="font-medium text-foreground">{formatDateTime(org.created_at)}</dd></div>
          {org.approved_at && <div><dt className="text-muted-foreground">Approved</dt><dd className="font-medium text-foreground">{formatDateTime(org.approved_at)}</dd></div>}
        </dl>
        {org.use_case && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Use Case</p>
            <p className="text-sm text-foreground">{org.use_case}</p>
          </div>
        )}
      </div>

      {(org.registration_status === 'pending' || org.registration_status === 'approved') && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Actions</h2>
          <Textarea label="Reason / Note (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a note..." />
          <div className="flex gap-3 flex-wrap">
            {org.registration_status === 'pending' && (
              <>
                <Button loading={acting === 'approve'} onClick={() => act('approve')}><CheckCircle className="h-4 w-4" />Approve</Button>
                <Button variant="outline" loading={acting === 'reject'} onClick={() => act('reject')} className="text-red-600 border-red-200"><XCircle className="h-4 w-4" />Reject</Button>
              </>
            )}
            {org.registration_status === 'approved' && (
              <Button variant="outline" loading={acting === 'suspend'} onClick={() => act('suspend')} className="text-yellow-600 border-yellow-200"><PauseCircle className="h-4 w-4" />Suspend</Button>
            )}
            {org.registration_status === 'suspended' && (
              <Button loading={acting === 'reactivate'} onClick={() => act('reactivate')}>Reactivate</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
