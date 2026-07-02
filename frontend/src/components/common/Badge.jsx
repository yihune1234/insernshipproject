import { clsx } from 'clsx';

const variants = {
  default: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  outline: 'border border-current text-muted-foreground',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', variant: 'success' },
    expired: { label: 'Expired', variant: 'warning' },
    revoked: { label: 'Revoked', variant: 'danger' },
    suspended: { label: 'Suspended', variant: 'warning' },
    pending: { label: 'Pending', variant: 'info' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    verified: { label: 'Verified', variant: 'success' },
    failed: { label: 'Failed', variant: 'danger' },
    issued: { label: 'Issued', variant: 'success' },
  };
  const cfg = map[status?.toLowerCase()] || { label: status || 'Unknown', variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
