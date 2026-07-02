import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CreditCard, Search, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import { getRequestCatalog, createHolderRequest } from '../../api/holder';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function RequestCredentialPage() {
  const navigate = useNavigate();
  const [credTypes, setCredTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    getRequestCatalog()
      .then((r) => setCredTypes(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  const filtered = credTypes.filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.organization_name?.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data) => {
    if (!selected) {
      toast.error('Please select a credential type');
      return;
    }
    setLoading(true);
    try {
      await createHolderRequest({
        credential_type: selected.id,
        organization: selected.organization_id,
        message: data.message || '',
      });
      toast.success('Credential request submitted successfully');
      navigate('/holder/requests');
    } catch (err) {
      const msg = err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]?.[0]
        || 'Failed to submit request';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Request a Credential</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Browse available credentials and submit a request to an issuer.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['Choose Credential', 'Add Details', 'Submit'].map((s, i) => {
          const step = selected ? (i < 2 ? 'done' : 'active') : (i === 0 ? 'active' : 'future');
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step === 'done' ? 'bg-primary text-primary-foreground' :
                step === 'active' ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {step === 'done' ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${step === 'active' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {s}
              </span>
              {i < 2 && <div className={`flex-1 h-px ${step === 'done' ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          );
        })}
      </div>

      {/* Credential catalog */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Available Credentials</h2>
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Change selection
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search credential types…"
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Grid */}
        {catalogLoading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No credential types match your search.' : 'No credential types available.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {filtered.map((t) => {
              const isSelected = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className={`rounded-lg p-2 shrink-0 mt-0.5 ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                    <CreditCard className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{t.name}</p>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    {t.organization_name && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">{t.organization_name}</p>
                      </div>
                    )}
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected preview */}
        {selected && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{selected.name}</p>
              {selected.organization_name && (
                <p className="text-xs text-muted-foreground">{selected.organization_name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form (visible once type selected) */}
      {selected && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground text-sm mb-4">Request Details</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Textarea
              label="Message to Issuer"
              placeholder="Provide any additional context or documents reference…"
              rows={4}
              {...register('message')}
            />
            <p className="text-xs text-muted-foreground -mt-3">
              Optional — add any relevant information the issuer may need.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                <ArrowRight className="h-4 w-4" />Submit Request
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
