export const flattenClaims = (credentialSubject) => {
  if (!credentialSubject) return [];
  return Object.entries(credentialSubject)
    .filter(([key]) => key !== 'id')
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase()),
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
};

export const formatClaimValue = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};
