import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { forgotPassword } from '../../api/auth';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground mb-4">We sent a password reset link to <strong>{email}</strong></p>
        <Link to="/login" className="text-primary text-sm font-medium hover:underline">← Back to login</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Forgot Password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-primary font-medium hover:underline">← Back to login</Link>
      </p>
    </div>
  );
}
