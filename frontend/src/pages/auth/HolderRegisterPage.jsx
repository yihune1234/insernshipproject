import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { nidInitiate, nidConfirm, register, verifyRegistrationOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STEPS = ['Identity', 'OTP Verification', 'Account Setup'];

export default function HolderRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fin, setFin] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [nidData, setNidData] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  // Step 0: Enter National ID (FIN)
  const handleFin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await nidInitiate({ fin });
      setSessionId(res.data.session_id || res.data.verification_id || '');
      toast.success('OTP sent to your registered phone number');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initiate verification');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify OTP
  const handleOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await nidConfirm({ session_id: sessionId, otp });
      setNidData(res.data);
      toast.success('Identity verified successfully');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create account
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const name = nidData?.full_name || `${nidData?.first_name || ''} ${nidData?.last_name || ''}`.trim() || data.name;
      const res = await register({ name, email: data.email, password: data.password, role: 'holder' });
      const userId = res.data?.user_id;
      if (userId) {
        toast.success('Account created! Please check your email for verification OTP.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">Create Holder Account</h1>
      <p className="text-sm text-muted-foreground mb-6">{STEPS[step]}</p>

      {step === 0 && (
        <form onSubmit={handleFin} className="space-y-4">
          <Input
            label="National ID Number (FIN)"
            placeholder="Enter your FIN"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            required
            hint="Your national identification number used to verify your identity"
          />
          <Button type="submit" loading={loading} className="w-full">Send OTP</Button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={handleOtp} className="space-y-4">
          <Input
            label="One-Time Password"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            hint="OTP sent to your registered phone number"
          />
          <Button type="submit" loading={loading} className="w-full">Verify OTP</Button>
          <button type="button" onClick={() => setStep(0)} className="w-full text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {nidData && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 mb-4">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">Identity Verified</p>
              <p className="text-sm text-green-600 dark:text-green-500">{nidData.full_name || `${nidData.first_name || ''} ${nidData.last_name || ''}`}</p>
            </div>
          )}
          <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Name required' })} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email', { required: 'Email required' })} />
          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })}
          />
          <Input
            label="Confirm Password"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />
          <Button type="submit" loading={loading} className="w-full">Create Account</Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
