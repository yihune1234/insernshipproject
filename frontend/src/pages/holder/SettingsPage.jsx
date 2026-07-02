import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import useAuthStore from '../../store/authStore';
import { changePassword, getMe } from '../../api/auth';
import { getWallets } from '../../api/holder';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import {
  User, Lock, Key, CreditCard, ShieldCheck, Copy,
  Fingerprint, Phone, Mail, Calendar,
} from 'lucide-react';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono = false, copyable = false }) {
  const copy = () => {
    navigator.clipboard.writeText(String(value));
    toast.success('Copied!');
  };
  return (
    <div className="flex items-center justify-between py-2.5 gap-4">
      <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
      <dd className={`flex items-center gap-2 text-sm font-medium text-foreground text-right ${mono ? 'font-mono text-xs' : ''}`}>
        <span className="truncate max-w-xs">{value || '—'}</span>
        {copyable && value && (
          <button onClick={copy} className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}

export default function HolderSettings() {
  const { user: ctxUser } = useAuth();
  const { user: storeUser } = useAuthStore();
  const user = ctxUser || storeUser;

  const [pwLoading, setPwLoading] = useState(false);
  const [wallets, setWallets] = useState([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  useEffect(() => {
    getWallets()
      .then((r) => setWallets(r.data?.results || r.data || []))
      .catch(() => {});
  }, []);

  const onPwSubmit = async (data) => {
    setPwLoading(true);
    try {
      await changePassword({ old_password: data.old_password, new_password: data.new_password });
      toast.success('Password updated successfully');
      reset();
    } catch (err) {
      const msg = err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]?.[0]
        || 'Failed to update password';
      toast.error(msg);
    } finally {
      setPwLoading(false);
    }
  };

  const identity = user?.identity;
  const did = user?.did || identity?.did || '';

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your identity and wallet preferences.</p>
      </div>

      {/* Identity badge */}
      {user?.national_id_verified && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
          <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            National Identity Verified
          </p>
        </div>
      )}

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <dl className="divide-y divide-border">
          <InfoRow
            label="Full Name"
            value={
              identity?.full_name
              || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null)
            }
          />
          <InfoRow label="Email" value={user?.email} icon={Mail} />
          <InfoRow label="Phone" value={user?.phone_number || identity?.phone} icon={Phone} />
          <InfoRow label="National ID" value={user?.national_id} />
          {identity?.dob && <InfoRow label="Date of Birth" value={identity.dob} />}
          {identity?.gender && <InfoRow label="Gender" value={identity.gender} />}
          {identity?.address && <InfoRow label="Address" value={identity.address} />}
          <InfoRow label="Role" value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Holder'} />
        </dl>
      </Section>

      {/* DID */}
      {did && (
        <Section title="Decentralized Identifier (DID)" icon={Fingerprint}>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Your DID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-foreground flex-1 break-all">{did}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(did); toast.success('DID copied!'); }}
                  className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your DID is a globally unique identifier anchored to your verified identity.
              It is used to cryptographically sign and receive verifiable credentials.
            </p>
          </div>
        </Section>
      )}

      {/* Wallets */}
      {wallets.length > 0 && (
        <Section title="Wallets" icon={CreditCard}>
          <div className="space-y-2">
            {wallets.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{w.wallet_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {w.is_active ? 'Active' : 'Inactive'} · {w.device_id || 'Default device'}
                  </p>
                </div>
                {w.is_active && (
                  <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Change Password */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={handleSubmit(onPwSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            autoComplete="current-password"
            error={errors.old_password?.message}
            {...register('old_password', { required: 'Current password is required' })}
          />
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            error={errors.new_password?.message}
            {...register('new_password', {
              required: 'New password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            error={errors.confirm?.message}
            {...register('confirm', {
              required: 'Please confirm your password',
              validate: (v) => v === watch('new_password') || 'Passwords do not match',
            })}
          />
          <Button type="submit" loading={pwLoading}>Update Password</Button>
        </form>
      </Section>

      {/* Account info */}
      <Section title="Account Info" icon={Key}>
        <dl className="divide-y divide-border">
          <InfoRow label="Account ID" value={user?.id} mono copyable />
          <InfoRow label="Status" value={user?.user_status === 'active' ? 'Active' : user?.user_status || 'Active'} />
          <InfoRow label="National ID Verified" value={user?.national_id_verified ? 'Yes' : 'No'} />
        </dl>
      </Section>
    </div>
  );
}
