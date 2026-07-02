import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { resetPassword } from '../../api/auth';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await resetPassword({
        token: params.get('token'),
        uid: params.get('uid'),
        new_password: data.password,
      });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Reset Password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your new password below.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          error={errors.password?.message}
          {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
        />
        <Input
          label="Confirm Password"
          type="password"
          error={errors.confirm?.message}
          {...register('confirm', {
            required: 'Required',
            validate: (v) => v === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-primary font-medium hover:underline">← Back to login</Link>
      </p>
    </div>
  );
}
