import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { getVerification } from '../../api/verifier';
import Button from '../../components/common/Button';
import { FullPageSpinner } from '../../components/common/Spinner';
import { formatDateTime } from '../../utils/formatDate';
import { flattenClaims } from '../../utils/claimsUtils';
import toast from 'react-hot-toast';

function CheckRow({ label, passed }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      {passed
        ? <span className="flex items-center gap-1 text-sm font-medium text-green-600"><CheckCircle className="h-4 w-4" />Passed</span>
        : <span className="flex items-center gap-1 text-sm font-medium text-red-600"><XCircle className="h-4 w-4" />Failed</span>}
    </div>
  );
}

export default function ResultDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVerification(id)
      .then((r) => setResult(r.data))
      .catch(() => toast.error('Failed to load result'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <FullPageSpinner />;
  if (!result) return <div className="py-16 text-center text-muted-foreground">Result not found.</div>;

  const isValid = result.is_valid || result.valid;
  const checks = result.checks || {};
  const claims = flattenClaims(result.credential?.credentialSubject || result.disclosed_claims || {});

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/verifier/history"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button></Link>

      <div className={`rounded-2xl border p-6 ${isValid ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center gap-3">
          {isValid ? <CheckCircle className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-red-600" />}
          <div>
            <h1 className={`text-xl font-bold ${isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isValid ? 'Credential Verified' : 'Verification Failed'}
            </h1>
            <p className="text-sm text-muted-foreground">{formatDateTime(result.verified_at || result.created_at)}</p>
          </div>
        </div>
      </div>

      {Object.keys(checks).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Verification Checks</h2>
          <div className="rounded-lg border border-border px-4">
            {checks.signature !== undefined && <CheckRow label="Signature" passed={checks.signature} />}
            {checks.expiry !== undefined && <CheckRow label="Expiry" passed={checks.expiry} />}
            {checks.revocation !== undefined && <CheckRow label="Revocation" passed={checks.revocation} />}
            {checks.issuer_trust !== undefined && <CheckRow label="Issuer Trust" passed={checks.issuer_trust} />}
          </div>
        </div>
      )}

      {claims.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Disclosed Claims</h2>
          <dl className="divide-y divide-border">
            {claims.map((c) => (
              <div key={c.key} className="flex justify-between py-3">
                <dt className="text-sm text-muted-foreground">{c.label}</dt>
                <dd className="text-sm font-medium text-foreground">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
