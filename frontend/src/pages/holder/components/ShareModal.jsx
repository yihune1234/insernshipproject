import { ShieldCheck } from 'lucide-react';
import Modal from '@components/common/Modal';
import Button from '@components/common/Button';

export default function ShareModal({ open, onClose, onShare, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share Credential"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Create a time-limited verification link. Anyone who scans the QR code or opens the link
          can verify this credential — no account required.
        </p>
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 p-3 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            A QR code will be generated that redirects to the platform's public verification page.
            Credentials are verified automatically — no clicks needed.
          </p>
        </div>
        <p className="text-xs font-medium text-muted-foreground">Choose link expiry:</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { h: 1, label: '1 Hour' },
            { h: 24, label: '24 Hours' },
            { h: 168, label: '7 Days' },
          ].map((opt) => (
            <Button
              key={opt.h}
              variant="outline"
              loading={loading}
              onClick={() => onShare(opt.h)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          The link stops working after the selected period. You can revoke it any time from Shared Links.
        </p>
      </div>
    </Modal>
  );
}
