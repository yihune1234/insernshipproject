import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getVerifierProfile, updateVerifierProfile } from '../../api/verifier';
import { changePassword } from '../../api/auth';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import { FullPageSpinner } from '../../components/common/Spinner';
import toast from 'react-hot-toast';

export default function VerifierSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const { register: reg2, handleSubmit: hs2, watch } = useForm();

  useEffect(() => {
    getVerifierProfile()
      .then((r) => {
        const p = r.data?.results?.[0] || r.data;
        reset({ name: p?.organization_name, website: p?.website, phone: p?.phone });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onSave = async (data) => {
    setSaving(true);
    try { await updateVerifierProfile(data); toast.success('Profile updated'); } catch (err) { toast.error(err.response?.data?.detail || 'Save failed'); } finally { setSaving(false); }
  };

  const onPasswordChange = async (data) => {
    setPwLoading(true);
    try { await changePassword({ old_password: data.old, new_password: data.new }); toast.success('Password changed'); } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); } finally { setPwLoading(false); }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Organization Profile</h2>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Input label="Organization Name" {...register('name')} />
          <Input label="Website" type="url" {...register('website')} />
          <Input label="Phone" {...register('phone')} />
          <Button type="submit" loading={saving}>Save Profile</Button>
        </form>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Change Password</h2>
        <form onSubmit={hs2(onPasswordChange)} className="space-y-4">
          <Input label="Current Password" type="password" {...reg2('old', { required: true })} />
          <Input label="New Password" type="password" {...reg2('new', { required: true })} />
          <Input label="Confirm" type="password" {...reg2('confirm', { validate: (v) => v === watch('new') || "Passwords don't match" })} />
          <Button type="submit" loading={pwLoading}>Update Password</Button>
        </form>
      </div>
    </div>
  );
}
