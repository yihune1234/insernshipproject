import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getIssuerProfile, updateIssuerProfile, getIssuerAuditLog } from '../../api/issuer';
import { changePassword } from '../../api/auth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { formatDate } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import { Settings, Lock, FileText } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const profileForm = useForm({ defaultValues: { contact_person_name: '', contact_person_email: '', phone: '' } });
  const pwdForm = useForm({ defaultValues: { current_password: '', new_password: '', confirm_password: '' } });

  useEffect(() => {
    getIssuerProfile()
      .then((r) => {
        profileForm.reset({
          contact_person_name: r.data?.contact_person_name || '',
          contact_person_email: r.data?.contact_person_email || r.data?.email || '',
          phone: r.data?.phone || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    getIssuerAuditLog({ page_size: 20 })
      .then((r) => setAuditLogs(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, []);

  const saveProfile = async (data) => {
    setSaving(true);
    try {
      await updateIssuerProfile(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const savePassword = async (data) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword({ current_password: data.current_password, new_password: data.new_password });
      toast.success('Password changed successfully');
      pwdForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally { setChangingPwd(false); }
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and organization settings.</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Contact Information</h2>
        <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
          <Input label="Contact Person Name" {...profileForm.register('contact_person_name')} />
          <Input label="Contact Email" type="email" {...profileForm.register('contact_person_email')} />
          <Input label="Phone" {...profileForm.register('phone')} />
          <Button type="submit" isLoading={saving}>Save Changes</Button>
        </form>
      </div>

      {/* Password */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4" /> Change Password
        </h2>
        <form onSubmit={pwdForm.handleSubmit(savePassword)} className="space-y-4">
          <Input label="Current Password" type="password" {...pwdForm.register('current_password', { required: true })} />
          <Input label="New Password" type="password" {...pwdForm.register('new_password', { required: true, minLength: 8 })} />
          <Input label="Confirm New Password" type="password" {...pwdForm.register('confirm_password', { required: true })} />
          <Button type="submit" isLoading={changingPwd}>Change Password</Button>
        </form>
      </div>

      {/* Audit Log */}
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" /> Recent Activity Log
        </h2>
        {logsLoading ? (
          <CardSkeleton />
        ) : auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No audit log entries yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auditLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-xs py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatDate(log.timestamp || log.created_at)}
                </span>
                <span className="font-medium text-foreground">{log.action_type || log.action || '—'}</span>
                <span className="text-muted-foreground">{log.entity_type || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
