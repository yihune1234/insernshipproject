import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
