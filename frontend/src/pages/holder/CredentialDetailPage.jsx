import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Share2, ArrowLeft, QrCode, Copy, Clock, Building2,
  ShieldCheck, Activity, ExternalLink, ChevronDown, ChevronUp,
  Download, X,
} from 'lucide-react';
import { getHolderCredential, createShare, getCredentialVerificationActivity } from '@/api/holder';
import { StatusBadge } from '@components/common/Badge';
import Button from '@components/common/Button';
import Modal from '@components/common/Modal';
import { FullPageSpinner } from '@components/common/Spinner';
import { formatDate, formatDateTime } from '@utils/formatDate';
import { flattenClaims } from '@utils/claimsUtils';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import CredentialInfoCard from './components/CredentialInfoCard';
import ShareModal from './components/ShareModal';
import VerificationActivitySection from './components/VerificationActivitySection';

function InfoRow({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-3 gap-4">
      <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
      <dd className={`text-sm font-medium text-foreground text-right ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

function QrOverlay({ qrUrl, shareUrl, shareToken, onClose }) {
  const download = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = 'credential-qr.png';
    a.click();
  };

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-slate-900 dark:text-white">Scan to Verify</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="rounded-2xl border-4 border-blue-600 p-2 bg-white shadow-lg">
            <img src={qrUrl} alt="Credential QR Code" className="w-56 h-56 rounded-lg" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Scan with any QR code reader
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Opens the platform's verification page automatically
            </p>
          </div>

          <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">Verification URL</p>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all leading-relaxed">
              {shareUrl}
            </p>
          </div>

          <div className="w-full flex gap-2">
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </button>
            <button
              onClick={download}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-medium text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Save QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CredentialDetailPage() {
  const { id } = useParams();
  const [credential, setCredential] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModal, setShareModal] = useState(false);
  const [qrOverlay, setQrOverlay] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getHolderCredential(id),
      getCredentialVerificationActivity(id).catch(() => null),
    ]).then(([credRes, actRes]) => {
      if (credRes.status === 'fulfilled') setCredential(credRes.value.data);
      if (actRes.status === 'fulfilled' && actRes.value) setActivity(actRes.value.data);
    }).catch(() => toast.error('Failed to load credential'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async (expiryHours = 24) => {
    setShareLoading(true);
    try {
      const res = await createShare(id, { expiry_hours: expiryHours });
      setShareResult(res.data);
      const token = res.data.token || res.data.share_token;
      const url = `${window.location.origin}/verify/${token}`;
      const qr = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#1e3a5f', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrUrl(qr);
      toast.success('Share link created');
      setShareModal(false);
      setQrOverlay(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to create share link');
    } finally {
      setShareLoading(false);
    }
  };

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${token}`);
    toast.success('Link copied to clipboard');
  };

  if (loading) return <FullPageSpinner />;
  if (!credential) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Credential not found.</p>
      <Link to="/holder/credentials" className="mt-4 inline-block text-primary hover:underline text-sm">
        ← Back to credentials
      </Link>
    </div>
  );

  const claims = flattenClaims(
    credential.credential_data?.credentialSubject
    || credential.credentialSubject
    || credential.claims
    || {}
  );
  const shareToken = shareResult?.token || shareResult?.share_token;
  const shareUrl = shareToken ? `${window.location.origin}/verify/${shareToken}` : '';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <CredentialInfoCard
        credential={credential}
        onShare={() => setShareModal(true)}
        qrUrl={qrUrl}
        onShowQr={() => setQrOverlay(true)}
      />

      {/* Inline QR preview */}
      {qrUrl && shareUrl && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <button
              onClick={() => setQrOverlay(true)}
              className="shrink-0 rounded-xl border-2 border-blue-300 dark:border-blue-700 p-1.5 bg-white shadow hover:scale-105 transition-transform"
            >
              <img src={qrUrl} alt="QR Code" className="w-28 h-28 rounded-lg" />
            </button>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Credential QR Code Ready</p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mb-3 leading-relaxed">
                Anyone can scan this QR code with any phone camera and be taken directly to the platform's
                verification page to confirm this credential's authenticity.
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => setQrOverlay(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                >
                  <QrCode className="h-3 w-3" /> Full Screen QR
                </button>
                <button
                  onClick={() => copyLink(shareToken)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Copy className="h-3 w-3" /> Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claims */}
      {claims.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-1">Credential Claims</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Verified attributes included in this credential.
          </p>
          <dl className="divide-y divide-border">
            {claims.map((c) => (
              <div key={c.key} className="flex items-start justify-between py-3 gap-4">
                <dt className="text-sm text-muted-foreground capitalize shrink-0">{c.label}</dt>
                <dd className="text-sm font-medium text-foreground text-right max-w-xs break-words">
                  {c.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <VerificationActivitySection activity={activity} />

      {/* Raw JSON */}
      {(credential.credential_data || credential.signed_jwt) && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
          >
            <span>Raw Credential Data</span>
            {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showRaw && (
            <pre className="p-4 text-xs text-muted-foreground bg-muted/30 overflow-auto max-h-80 border-t border-border">
              {JSON.stringify(credential.credential_data || { jwt: credential.signed_jwt }, null, 2)}
            </pre>
          )}
        </div>
      )}

      <ShareModal
        open={shareModal}
        onClose={() => setShareModal(false)}
        onShare={handleShare}
        loading={shareLoading}
      />

      {qrOverlay && qrUrl && shareUrl && (
        <QrOverlay
          qrUrl={qrUrl}
          shareUrl={shareUrl}
          shareToken={shareToken}
          onClose={() => setQrOverlay(false)}
        />
      )}
    </div>
  );
}
