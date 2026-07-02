import { useEffect, useState } from 'react';
import { Key, Plus, Copy, Trash2, RefreshCw } from 'lucide-react';
import { getOrgApiKeys, createOrgApiKey, deleteOrgApiKey } from '../../api/verifier';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = () => {
    setLoading(true);
    getOrgApiKeys()
      .then((r) => setKeys(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (data) => {
    setCreating(true);
    try {
      const res = await createOrgApiKey(data);
      setNewKey(res.data);
      load();
      reset();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create API key');
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOrgApiKey(deleteId);
      toast.success('API key deleted');
      setDeleteId(null);
      load();
    } catch { toast.error('Failed to delete key'); } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
        <Button size="sm" onClick={() => { setModal(true); setNewKey(null); }}><Plus className="h-4 w-4" />New Key</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No API keys yet. Create one to integrate with CredWallet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm text-foreground">{k.name || 'API Key'}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">{k.key_prefix || k.key?.slice(0, 12) || ''}...</p>
                  <p className="text-xs text-muted-foreground mt-1">Created: {formatDateTime(k.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(k.key || k.key_prefix || ''); toast.success('Copied'); }}>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(k.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); reset(); setNewKey(null); }} title="Create API Key">
        {newKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">Save this key — it won't be shown again</p>
              <p className="font-mono text-xs break-all text-foreground">{newKey.key || newKey.api_key}</p>
            </div>
            <Button className="w-full" onClick={() => { navigator.clipboard.writeText(newKey.key || newKey.api_key); toast.success('Copied!'); }}>
              <Copy className="h-4 w-4" />Copy Key
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <Input label="Key Name" placeholder="e.g. Production Integration" error={errors.name?.message} {...register('name', { required: 'Required' })} />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>Create</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete API Key?" description="This key will be immediately invalidated. Any integrations using it will stop working." confirmLabel="Delete" />
    </div>
  );
}
