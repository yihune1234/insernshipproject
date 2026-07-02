import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPendingRegistration, getRegistrationDocuments,
  approveRegistration, rejectRegistration,
} from '../../api/admin';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { formatDate } from '../../utils/formatDate';
import { ArrowLeft, CheckCircle2, XCircle, FileText, Download, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrganizationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reg, setReg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    Promise.all([
      getPendingRegistration(id),
      getRegistrationDocuments(id),
    ]).then(([r, d]) => {
      setReg(r.data);
      setDocs(d.data || []);
    }).catch(() => toast.error('Failed to load registration'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setActing('approve');
    try {
      await approveRegistration(id);
      toast.success('Organization approved and account created');
      navigate('/admin/organizations?tab=pending');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    } finally { setActing(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
    setActing('reject');
    try {
      await rejectRegistration(id, { reason: rejectReason });
      toast.success('Registration rejected');
      navigate('/admin/organizations?tab=pending');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    } finally { setActing(null); }
  };

  if (loading) return <CardSkeleton />;
  if (!reg) return <div className="text-muted-foreground">Registration not found.</div>;

  const isAlreadyDecided = reg.status === 'approved' || reg.status === 'rejected';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/organizations')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{reg.organization_name}</h1>
            <StatusBadge status={reg.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submitted {formatDate(reg.submitted_at)} · {reg.organization_type || 'No type'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Organization Info */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Organization</h2>
          </div>
          {[
            ['Name', reg.organization_name],
            ['Type', reg.organization_type],
            ['Email', reg.email],
            ['Phone', reg.phone],
            ['Website', reg.website],
            ['Address', reg.address],
          ].map(([label, val]) => val ? (
            <div key={label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-20 flex-shrink-0">{label}</span>
              <span className="text-foreground break-all">{val}</span>
            </div>
          ) : null)}
        </div>

        {/* Contact & Use Case */}
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Contact & Use Case</h2>
          {[
            ['Contact', reg.contact_person_name],
            ['Contact Email', reg.contact_person_email],
          ].map(([label, val]) => val ? (
            <div key={label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground w-28 flex-shrink-0">{label}</span>
              <span className="text-foreground">{val}</span>
            </div>
          ) : null)}
          {reg.use_case_description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Use Case</p>
              <p className="text-sm text-foreground">{reg.use_case_description}</p>
            </div>
          )}
          {reg.intended_credential_types?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Intended Credential Types</p>
              <div className="flex flex-wrap gap-1">
                {reg.intended_credential_types.map((t, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents ({docs.length})
        </h2>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 rounded border border-border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.document_type_display}</p>
                    <p className="text-xs text-muted-foreground">{doc.file_name} · {formatDate(doc.uploaded_at)}</p>
                  </div>
                </div>
                {doc.download_url && (
                  <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection reason if rejected */}
      {reg.status === 'rejected' && reg.rejection_reason && (
        <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700 dark:text-red-300">{reg.rejection_reason}</p>
          <p className="text-xs text-muted-foreground mt-1">Reviewed {formatDate(reg.reviewed_at)}</p>
        </div>
      )}

      {/* Action Buttons */}
      {!isAlreadyDecided && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Review Decision</h2>

          {!showRejectForm ? (
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                isLoading={acting === 'approve'}
                disabled={!!acting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve & Create Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                disabled={!!acting}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Explain why this registration is being rejected..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  isLoading={acting === 'reject'}
                  disabled={!!acting || !rejectReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(false)}
                  disabled={!!acting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
