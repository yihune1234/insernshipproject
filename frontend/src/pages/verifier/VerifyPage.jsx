import { useState, useRef } from 'react';
import { Link as LinkIcon, Hash, Upload, QrCode, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { verifyPublic, createVerification } from '../../api/verifier';
import { flattenClaims } from '../../utils/claimsUtils';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const METHODS = [
  { id: 'link', label: 'Share Link / Token', icon: LinkIcon },
  { id: 'id', label: 'Credential ID', icon: Hash },
  { id: 'file', label: 'Upload JSON', icon: Upload },
];

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

export default function VerifyPage() {
  const [method, setMethod] = useState('link');
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      let res;
      if (method === 'link') {
        const token = input.trim().split('/').pop();
        res = await verifyPublic({ token });
      } else if (method === 'id') {
        res = await verifyPublic({ credential_id: input.trim() });
      } else if (method === 'file') {
        if (!file) { toast.error('Please select a file'); setLoading(false); return; }
        const text = await file.text();
        const data = JSON.parse(text);
        res = await verifyPublic({ credential_data: data });
      }
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = result?.is_valid || result?.valid;
  const checks = result?.checks || {};
  const credential = result?.credential || result?.credential_data || {};
  const claims = flattenClaims(credential?.credentialSubject || {});

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Verify a Credential</h1>

      <div className="flex gap-2 rounded-xl bg-muted p-1">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMethod(m.id); setResult(null); setError(null); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              method === m.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <m.icon className="h-4 w-4" />
            <span className="hidden sm:block">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {method === 'link' && (
          <Input label="Share Link or Token" placeholder="Paste share URL or token" value={input} onChange={(e) => setInput(e.target.value)} />
        )}
        {method === 'id' && (
          <Input label="Credential ID" placeholder="Enter credential UUID" value={input} onChange={(e) => setInput(e.target.value)} />
        )}
        {method === 'file' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Upload Credential JSON</label>
            <input type="file" accept=".json" onChange={(e) => setFile(e.target.files[0])} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        )}
        <Button className="w-full" onClick={handleVerify} loading={loading} disabled={method !== 'file' ? !input.trim() : !file}>
          Verify Credential
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className={`px-6 py-5 ${isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-3">
              {isValid ? <CheckCircle className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-red-600" />}
              <div>
                <h2 className={`text-xl font-bold ${isValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {isValid ? 'Credential Verified' : 'Verification Failed'}
                </h2>
                {!isValid && result?.reason && <p className="text-sm text-red-600">{result.reason}</p>}
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            {Object.keys(checks).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Verification Checks</h3>
                <div className="rounded-lg border border-border px-4">
                  {checks.signature !== undefined && <CheckRow label="Signature" passed={checks.signature} />}
                  {checks.expiry !== undefined && <CheckRow label="Expiry" passed={checks.expiry} />}
                  {checks.revocation !== undefined && <CheckRow label="Revocation" passed={checks.revocation} />}
                  {checks.issuer_trust !== undefined && <CheckRow label="Issuer Trust" passed={checks.issuer_trust} />}
                </div>
              </div>
            )}
            {claims.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Claims</h3>
                <dl className="space-y-2">
                  {claims.map((c) => (
                    <div key={c.key} className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">{c.label}</dt>
                      <dd className="font-medium text-foreground">{c.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
