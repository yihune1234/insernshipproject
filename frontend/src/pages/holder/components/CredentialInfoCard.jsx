import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Share2, QrCode, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@components/common/Badge';
import Button from '@components/common/Button';
import { formatDate } from '@utils/formatDate';

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

export default function CredentialInfoCard({ credential, onShare, qrUrl, onShowQr }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Link to="/holder/credentials">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Back
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden mt-5">
        <div className={`h-2 ${credential.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : credential.status === 'revoked' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-yellow-500 to-amber-600'}`} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {credential.credential_type_name || credential.type || 'Credential'}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {credential.issuer_name || credential.organization_name || '—'}
                </p>
              </div>
            </div>
            <StatusBadge status={credential.status} />
          </div>

          <dl className="divide-y divide-border">
            <InfoRow label="Issued" value={formatDate(credential.issued_at || credential.issuanceDate)} />
            <InfoRow label="Expires" value={credential.expiration_date ? formatDate(credential.expiration_date) : 'No expiry'} />
            <InfoRow label="Credential ID" value={credential.credential_uuid || credential.credential_id || credential.id} mono />
            {credential.holder_did && <InfoRow label="Holder DID" value={credential.holder_did} mono />}
            {credential.issuer_did && <InfoRow label="Issuer DID" value={credential.issuer_did} mono />}
          </dl>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button
              size="sm"
              onClick={onShare}
              disabled={credential.status !== 'active'}
            >
              <Share2 className="h-3.5 w-3.5" />Share & Generate QR
            </Button>
            {qrUrl && (
              <Button size="sm" variant="outline" onClick={onShowQr}>
                <QrCode className="h-3.5 w-3.5" />Show QR Code
              </Button>
            )}
            {credential.verification_url && (
              <a
                href={credential.verification_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />Verify
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
