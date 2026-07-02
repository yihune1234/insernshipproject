import { clsx } from 'clsx';
import { forwardRef } from 'react';

const Textarea = forwardRef(({ className = '', label, error, rows = 4, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          error && 'border-destructive',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';
export default Textarea;
