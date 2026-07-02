import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-input disabled:opacity-50 hover:bg-accent transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        let p;
        if (totalPages <= 5) p = i + 1;
        else if (page <= 3) p = i + 1;
        else if (page >= totalPages - 2) p = totalPages - 4 + i;
        else p = page - 2 + i;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'border border-input hover:bg-accent'
            }`}
          >
            {p}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-input disabled:opacity-50 hover:bg-accent transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
