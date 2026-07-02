import Button from '@components/common/Button';
import Input from '@components/common/Input';

export default function StepVerifyOtp({ email, otp, onOtpChange, onSubmit, loading, onBack }) {
  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Verify Your Email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>
      <Input
        label="Verification Code"
        value={otp}
        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        maxLength={6}
        placeholder="000000"
      />
      <Button type="submit" isLoading={loading} className="w-full" disabled={otp.length < 6}>
        Verify Email
      </Button>
      <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground"
        onClick={onBack}>
        ← Back to change email
      </button>
    </form>
  );
}
