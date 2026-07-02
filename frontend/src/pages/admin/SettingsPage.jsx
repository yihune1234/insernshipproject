import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getAdminProfile, updateAdminProfile, changeAdminPassword } from '../../api/admin';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FullPageSpinner } from '../../components/common/Spinner';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const { register: reg2, handleSubmit: hs2, watch } = useForm();

  useEffect(() => {
    getAdminProfile()
      .then((r) => reset({ first_name: r.data?.first_name, last_name: r.data?.last_name, email: r.data?.email }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onSave = async (data) => {
    setSaving(true);
    try { await updateAdminProfile(data); toast.success('Profile updated'); } catch (err) { toast.error(err.response?.data?.detail || 'Save failed'); } finally { setSaving(false); }
  };

  const onPasswordChange = async (data) => {
    setPwLoading(true);
    try { await changeAdminPassword({ old_password: data.old, new_password: data.new }); toast.success('Password changed'); } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); } finally { setPwLoading(false); }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Admin Profile</h2>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" {...register('first_name')} />
            <Input label="Last Name" {...register('last_name')} />
          </div>
          <Input label="Email" type="email" {...register('email')} />
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
