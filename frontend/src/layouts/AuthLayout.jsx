import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">CredWallet</span>
          </Link>
          <p className="text-sm text-muted-foreground">Digital Credential Wallet System</p>
        </div>
        <div className="rounded-2xl border border-border bg-card shadow-lg p-8">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CredWallet. All rights reserved.
        </p>
      </div>
    </div>
  );
}
