import { useEffect, useState } from 'react';
import { Fingerprint, Plus, ExternalLink, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getPresentations,
  createPresentation,
  generateHolderPresentation,
  getHolderCredentials,
} from '../../api/holder';
import { StatusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

function PresentationCard({ presentation, onExpand, isExpanded }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onExpand}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
            <Fingerprint className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground truncate">
              {presentation.verifier_name || presentation.purpose || 'Presentation'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={presentation.status || 'submitted'} />
              <span className="text-xs text-muted-foreground">
                {formatDateTime(presentation.created_at)}
              </span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-border p-4 bg-muted/20">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs text-foreground">{presentation.id?.slice(0, 12)}…</dd>
            </div>
            {presentation.verifier_did && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">Verifier DID</dt>
                <dd className="font-mono text-xs text-foreground truncate">{presentation.verifier_did}</dd>
              </div>
            )}
            {presentation.holder_did && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">Holder DID</dt>
                <dd className="font-mono text-xs text-foreground truncate">{presentation.holder_did}</dd>
              </div>
            )}
            {presentation.credential_ids?.length > 0 && (
              <div>
                <dt className="text-muted-foreground mb-1">Credentials included</dt>
                <dd className="flex flex-wrap gap-1">
                  {presentation.credential_ids.map((cid) => (
                    <span key={cid} className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                      {cid.slice(0, 8)}…
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {presentation.purpose && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Purpose</dt>
                <dd className="text-foreground">{presentation.purpose}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

export default function PresentationPage() {
  const [presentations, setPresentations] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [selectedCreds, setSelectedCreds] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [verifierDid, setVerifierDid] = useState('');

  useEffect(() => {
    Promise.allSettled([
      getPresentations(),
      getHolderCredentials({ status: 'active', page_size: 50 }),
    ]).then(([presRes, credsRes]) => {
      if (presRes.status === 'fulfilled') {
        setPresentations(presRes.value.data?.results || presRes.value.data || []);
      }
      if (credsRes.status === 'fulfilled') {
        const d = credsRes.value.data;
        setCredentials(d?.results || d || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggleCred = (id) => {
    setSelectedCreds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selectedCreds.length === 0) {
      toast.error('Select at least one credential');
      return;
    }
    setCreating(true);
    try {
      const res = await createPresentation({
        credential_ids: selectedCreds,
        purpose: purpose || 'Verification',
        verifier_did: verifierDid || undefined,
      });
      setPresentations((p) => [res.data, ...p]);
      setCreateModal(false);
      setSelectedCreds([]);
      setPurpose('');
      setVerifierDid('');
      toast.success('Presentation created');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to create presentation');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presentations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verifiable proofs you have created from your credentials.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateModal(true)}>
          <Plus className="h-4 w-4" />New Presentation
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : presentations.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Fingerprint className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground text-sm mb-1">No presentations yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a verifiable presentation to share specific credential data.
          </p>
          <Button size="sm" onClick={() => setCreateModal(true)}>
            <Plus className="h-4 w-4" />Create Presentation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {presentations.map((p) => (
            <PresentationCard
              key={p.id}
              presentation={p}
              isExpanded={expandedId === p.id}
              onExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); setSelectedCreds([]); setPurpose(''); setVerifierDid(''); }}
        title="Create Presentation"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select the credentials to include in this presentation.
          </p>

          {/* Credential selection */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Credentials *</p>
            {credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active credentials available.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {credentials.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedCreds.includes(c.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCreds.includes(c.id)}
                      onChange={() => toggleCred(c.id)}
                      className="rounded text-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.credential_type_name || c.type || 'Credential'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.issuer_name || '—'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Employment verification"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Verifier DID (optional) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Verifier DID <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={verifierDid}
              onChange={(e) => setVerifierDid(e.target.value)}
              placeholder="did:key:z6Mk…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={creating}
              disabled={selectedCreds.length === 0}
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
