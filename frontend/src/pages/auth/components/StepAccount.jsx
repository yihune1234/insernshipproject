import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Input from '@components/common/Input';
import Button from '@components/common/Button';

export default function StepAccount({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Create Your Account</h2>
        <p className="text-sm text-muted-foreground">Start your issuer registration journey.</p>
      </div>
      <Input
        label="Email Address"
        type="email"
        {...register('email', { required: 'Email is required' })}
        error={errors.email?.message}
        placeholder="you@organization.edu"
      />
      <Input
        label="Password"
        type="password"
        {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
        error={errors.password?.message}
        placeholder="Create a strong password"
      />
      <Button type="submit" isLoading={loading} className="w-full">Continue</Button>
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">Login</Link>
      </p>
    </form>
  );
}
