import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Link as LinkIcon, Upload, Hash, CheckCircle, XCircle, AlertCircle,
  ShieldCheck, ShieldX, Clock, Search, Camera, RotateCcw,
} from 'lucide-react';
import { verifyPublic } from '../../api/verifier';
import { formatDate } from '../../utils/formatDate';
import { flattenClaims } from '../../utils/claimsUtils';
import QrCameraScanner from '../../components/common/QrCameraScanner';
import toast from 'react-hot-toast';

const METHODS = [
  { id: 'camera', label: 'Scan QR', icon: Camera },
  { id: 'link', label: 'Share Link', icon: LinkIcon },
  { id: 'id', label: 'Credential ID', icon: Hash },
  { id: 'file', label: 'Upload File', icon: Upload },
];

/* ── Small helpers ─────────────────────────────────────────────────────────── */

function StatusBadge({ isValid, isRevoked, isExpired }) {
  if (isRevoked) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 text-sm font-semibold text-orange-700 dark:text-orange-400">
      <ShieldX className="h-4 w-4" /> Revoked Credential
    </span>
  );
  if (isExpired) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
      <Clock className="h-4 w-4" /> Expired Credential
    </span>
  );
  if (isValid) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
      <ShieldCheck className="h-4 w-4" /> Valid Credential
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1.5 text-sm font-semibold text-red-700 dark:text-red-400">
      <XCircle className="h-4 w-4" /> Not Valid
    </span>
  );
}

function CheckRow({ label, passed }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      {passed ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-2.5 py-1">
          <CheckCircle className="h-3.5 w-3.5" /> Passed
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-full px-2.5 py-1">
          <XCircle className="h-3.5 w-3.5" /> Failed
        </span>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Result card ───────────────────────────────────────────────────────────── */

function ResultCard({ result, onReset }) {
  const isValid   = result?.is_valid || result?.valid;
  const checks    = result?.checks || {};
  const credential = result?.credential || result?.credential_data || {};
  const subject   = credential?.credentialSubject || {};
  const claims    = flattenClaims(subject);
  const isRevoked = !isValid && checks.revocation === false;
  const isExpired = !isValid && checks.expiry === false;

  const headerBg = isValid
    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
    : isRevoked
    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    : isExpired
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

  const titleColor = isValid
    ? 'text-emerald-800 dark:text-emerald-300'
    : isRevoked ? 'text-orange-800 dark:text-orange-300'
    : isExpired ? 'text-yellow-800 dark:text-yellow-300'
    : 'text-red-800 dark:text-red-300';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Result header */}
      <div className={`px-5 py-4 border-b ${headerBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h2 className={`text-lg font-bold mb-1 ${titleColor}`}>
              {isValid ? 'Credential Verified ✓'
                : isRevoked ? 'Revoked Credential'
                : isExpired ? 'Expired Credential'
                : 'Verification Failed'}
            </h2>
            {!isValid && result?.reason && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{result.reason}</p>
            )}
          </div>
          <StatusBadge isValid={isValid} isRevoked={isRevoked} isExpired={isExpired} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Verification checks grid */}
        {Object.keys(checks).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Verification Checks
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { key: 'signature', label: 'Cryptographic Signature' },
                { key: 'expiry', label: 'Expiry Status' },
                { key: 'revocation', label: 'Revocation Status' },
                { key: 'issuer_trust', label: 'Issuer Trust Registry' },
              ].filter(({ key }) => checks[key] !== undefined).map(({ key, label }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm border ${
                    checks[key]
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40'
                  }`}
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                  {checks[key]
                    ? <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0" />
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credential details */}
        {credential && Object.keys(credential).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Credential Details
            </h3>
            <dl className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {result?.issuer_name && (
                <div className="flex justify-between items-center px-4 py-3 text-sm bg-slate-50 dark:bg-slate-950">
                  <dt className="text-slate-500 dark:text-slate-400">Issuing Organization</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">{result.issuer_name}</dd>
                </div>
              )}
              {result?.credential_type && (
                <div className="flex justify-between items-center px-4 py-3 text-sm bg-slate-50 dark:bg-slate-950">
                  <dt className="text-slate-500 dark:text-slate-400">Credential Type</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white text-right">{result.credential_type}</dd>
                </div>
              )}
              {credential?.issuanceDate && (
                <div className="flex justify-between items-center px-4 py-3 text-sm bg-slate-50 dark:bg-slate-950">
                  <dt className="text-slate-500 dark:text-slate-400">Issued Date</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">{formatDate(credential.issuanceDate)}</dd>
                </div>
              )}
              {credential?.expirationDate && (
                <div className="flex justify-between items-center px-4 py-3 text-sm bg-slate-50 dark:bg-slate-950">
                  <dt className="text-slate-500 dark:text-slate-400">Expiry Date</dt>
                  <dd className={`font-semibold text-right ${isExpired ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatDate(credential.expirationDate)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Claims */}
        {claims.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Credential Claims
            </h3>
            <dl className="grid sm:grid-cols-2 gap-2">
              {claims.map((c) => (
                <div key={c.key} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3">
                  <dt className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{c.label}</dt>
                  <dd className="text-sm font-semibold text-slate-900 dark:text-white break-words">{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Scan another */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Verify Another Credential
        </button>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */

export default function VerifyPublicPage() {
  const { token: urlToken } = useParams();
  const [method, setMethod] = useState(urlToken ? 'link' : 'camera');
  const [input, setInput] = useState(urlToken || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scannerActive, setScannerActive] = useState(!urlToken);

  /* ── Core verify function ─────────────────────────────────────────────── */
  const runVerify = useCallback(async (overrideInput, overrideMethod) => {
    const m = overrideMethod || method;
    const inp = overrideInput !== undefined ? overrideInput : input;

    setLoading(true);
    setResult(null);
    setError(null);
    setScannerActive(false);

    try {
      let res;
      if (m === 'camera' || m === 'link') {
        const token = inp.trim().split('/').pop();
        res = await verifyPublic({ token });
      } else if (m === 'id') {
        res = await verifyPublic({ credential_id: inp.trim() });
      } else if (m === 'file') {
        if (!file) { toast.error('Please select a file'); setLoading(false); return; }
        const text = await file.text();
        const data = JSON.parse(text);
        res = await verifyPublic({ credential_data: data });
      }
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Verification failed. Please check your input and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [method, input, file]);

  /* ── Auto-verify when landing on /verify/:token ───────────────────────── */
  useEffect(() => {
    if (urlToken) {
      runVerify(urlToken, 'link');
    }
  }, []); // only on mount

  /* ── Camera QR detected → auto-verify immediately ────────────────────── */
  const handleQrDetected = useCallback((decodedText) => {
    toast.success('QR code detected — verifying…', { duration: 2000 });
    setInput(decodedText);
    runVerify(decodedText, 'camera');
  }, [runVerify]);

  const reset = () => {
    setResult(null);
    setError(null);
    setInput('');
    setFile(null);
    setScannerActive(method === 'camera');
  };

  const switchMethod = (m) => {
    setMethod(m);
    setResult(null);
    setError(null);
    setInput('');
    setFile(null);
    setScannerActive(m === 'camera');
  };

  const activeMethod = METHODS.find((m) => m.id === method);

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg mb-5">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Credential Verification
          </h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            Scan a QR code with your camera, paste a share link, enter a credential ID,
            or upload a file. Verification is instant — no account required.
          </p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="py-10 px-4">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Method tabs */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1 gap-1">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => switchMethod(m.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all ${
                  method === m.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <m.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:block">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Loading overlay while auto-verifying from URL */}
          {loading && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 flex flex-col items-center gap-4 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Spinner />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-white">Verifying credential…</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Checking signature, expiry, revocation & trust</p>
              </div>
            </div>
          )}

          {/* Result */}
          {!loading && result && <ResultCard result={result} onReset={reset} />}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Verification Error</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-800 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Try Again
              </button>
            </div>
          )}

          {/* Input panels (only when no result/loading) */}
          {!loading && !result && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">

              {/* ── Camera panel ────────────────────────────────────────── */}
              {method === 'camera' && (
                <div className="p-5">
                  <QrCameraScanner onScan={handleQrDetected} active={scannerActive} />
                </div>
              )}

              {/* ── Link / ID panels ────────────────────────────────────── */}
              {(method === 'link' || method === 'id') && (
                <div className="p-5 space-y-4">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {method === 'link' ? 'Share Link or Token' : 'Credential ID'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && input.trim() && runVerify()}
                      placeholder={method === 'link' ? 'https://… or paste share token' : 'Enter credential UUID'}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => runVerify()}
                    disabled={!input.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed py-3 text-sm font-semibold text-white transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" /> Verify Credential
                  </button>
                </div>
              )}

              {/* ── File upload panel ───────────────────────────────────── */}
              {method === 'file' && (
                <div className="p-5 space-y-4">
                  <label
                    htmlFor="cred-file"
                    className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-10 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <Upload className="h-9 w-9 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {file ? file.name : 'Click to upload credential JSON file'}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">.json files accepted</span>
                    <input id="cred-file" type="file" accept=".json" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  </label>
                  <button
                    onClick={() => runVerify()}
                    disabled={!file}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed py-3 text-sm font-semibold text-white transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" /> Verify Credential
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Trust notice */}
          {!loading && !result && (
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3">
              <ShieldCheck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Verification checks cryptographic signature, expiry date, revocation status, and issuer trust.
                No personal data is stored during verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
