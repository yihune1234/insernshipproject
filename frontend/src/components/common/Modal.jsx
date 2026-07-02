import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export default function Modal({ open, onClose, title, children, size = 'md', className = '' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative z-10 w-full rounded-xl bg-card shadow-2xl border border-border', sizes[size], className)}>
        {title && (
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-accent transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
