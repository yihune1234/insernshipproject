export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const ROLES = {
  ADMIN: 'admin',
  ISSUER: 'issuer',
  VERIFIER: 'verifier',
  HOLDER: 'holder',
};

export const ROLE_DASHBOARDS = {
  admin: '/admin/dashboard',
  issuer: '/issuer/dashboard',
  verifier: '/verifier/dashboard',
  holder: '/holder/dashboard',
};

export const CREDENTIAL_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
};

export const ORG_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

export const NOTIFICATION_POLL_INTERVAL = 60000;

export const PAGE_SIZE = 20;
