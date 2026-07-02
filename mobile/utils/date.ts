export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelative(iso: string): string {
  const now = Date.now();
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.floor(mins % 60);
    return m > 0 ? `Today, ${formatTime(iso)}` : `Today, ${formatTime(iso)}`;
  }
  if (days === 1) return `Yesterday`;
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function groupByDate(items: { timestamp: string }[]): Record<string, typeof items> {
  const groups: Record<string, typeof items> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (const item of items) {
    const d = new Date(item.timestamp);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = 'TODAY';
    else if (d.toDateString() === yesterday.toDateString()) key = 'YESTERDAY';
    else
      key = d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}
