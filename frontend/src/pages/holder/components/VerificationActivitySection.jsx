import { Activity } from 'lucide-react';
import { formatDateTime } from '@utils/formatDate';

export default function VerificationActivitySection({ activity }) {
  if (!activity) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">Verification Activity</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{activity.total_verifications || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </div>
        {activity.last_verified_at && (
          <div className="col-span-2 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Last verified</p>
            <p className="text-sm font-medium text-foreground">{formatDateTime(activity.last_verified_at)}</p>
          </div>
        )}
      </div>
      {activity.verifications_by_method && Object.keys(activity.verifications_by_method).length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">By method</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activity.verifications_by_method).map(([meth, count]) => (
              <span
                key={meth}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {meth}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
