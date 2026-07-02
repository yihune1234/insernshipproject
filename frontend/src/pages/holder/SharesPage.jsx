import { useEffect, useState } from 'react';
import { Link2, Copy, Eye, Clock, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { getShares, disableSharing } from '../../api/holder';
import { formatDateTime, isExpired } from '../../utils/formatDate';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

function ShareCard({ share, onRevoke }) {
  const [revoking, setRevoking] = useState(false);
  const expired = isExpired(share.expires_at);
  const token = share.token || share.share_token;
  const shareUrl = `${window.location.origin}/verify/${token}`;

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!');
  };

  const revoke = async () => {
    setRevoking(true);
    try {
      await disableSharing({ credential_id: share.credential_id });
      onRevoke(share.id);
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke share link');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-opacity ${
        expired ? 'opacity-60 border-border' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Credential name */}
          <div className="flex items-center gap-2 mb-1.5">
            <p className="font-medium text-sm text-foreground truncate">
              {share.credential_type_name || share.credential_name || 'Credential'}
            </p>
            {expired ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-400">
                <Clock className="h-3 w-3" />Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />Active
              </span>
            )}
          </div>

          {/* Token */}
          <p className="text-xs text-muted-foreground font-mono truncate mb-2">
            {token}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {share.access_count || 0} view{share.access_count !== 1 ? 's' : ''}
            </span>
            {share.expires_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {expired ? 'Expired' : 'Expires'}: {formatDateTime(share.expires_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!expired && (
            <Button
              size="icon"
              variant="ghost"
              onClick={copy}
              title="Copy link"
              className="h-8 w-8"
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            loading={revoking}
            onClick={revoke}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
            title="Revoke"
          >
            Revoke
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SharesPage() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShares()
      .then((r) => setShares(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = (id) => {
    setShares((s) => s.filter((x) => x.id !== id));
  };

  const active = shares.filter((s) => !isExpired(s.expires_at)).length;
  const expired = shares.length - active;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Shared Links</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage public links for your shared credentials.
        </p>
      </div>

      {/* Stats */}
      {!loading && shares.length > 0 && (
        <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{active}</strong> active,{' '}
              <strong className="text-foreground">{expired}</strong> expired
            </span>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Share links let anyone with the link view your credential. Create them from a credential's detail page and revoke any time.
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : shares.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground text-sm mb-1">No shared links yet</p>
          <p className="text-sm text-muted-foreground">
            Open a credential and click <strong>Share</strong> to create a link.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((s) => (
            <ShareCard key={s.id} share={s} onRevoke={handleRevoke} />
          ))}
        </div>
      )}
    </div>
  );
}
