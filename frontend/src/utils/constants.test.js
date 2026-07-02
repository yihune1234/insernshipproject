import { describe, it, expect } from 'vitest';
import {
  API_BASE_URL,
  ROLES,
  ROLE_DASHBOARDS,
  CREDENTIAL_STATUS,
  ORG_STATUS,
  NOTIFICATION_POLL_INTERVAL,
  PAGE_SIZE,
} from './constants';

describe('constants', () => {
  it('API_BASE_URL is defined', () => {
    expect(API_BASE_URL).toBeDefined();
  });

  it('ROLES has all expected roles', () => {
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.ISSUER).toBe('issuer');
    expect(ROLES.VERIFIER).toBe('verifier');
    expect(ROLES.HOLDER).toBe('holder');
  });

  it('ROLE_DASHBOARDS maps roles to paths', () => {
    expect(ROLE_DASHBOARDS.admin).toBe('/admin/dashboard');
    expect(ROLE_DASHBOARDS.issuer).toBe('/issuer/dashboard');
    expect(ROLE_DASHBOARDS.verifier).toBe('/verifier/dashboard');
    expect(ROLE_DASHBOARDS.holder).toBe('/holder/dashboard');
  });

  it('CREDENTIAL_STATUS has all statuses', () => {
    expect(CREDENTIAL_STATUS.ACTIVE).toBe('active');
    expect(CREDENTIAL_STATUS.EXPIRED).toBe('expired');
    expect(CREDENTIAL_STATUS.REVOKED).toBe('revoked');
    expect(CREDENTIAL_STATUS.SUSPENDED).toBe('suspended');
    expect(CREDENTIAL_STATUS.PENDING).toBe('pending');
  });

  it('ORG_STATUS has all statuses', () => {
    expect(ORG_STATUS.PENDING).toBe('pending');
    expect(ORG_STATUS.APPROVED).toBe('approved');
    expect(ORG_STATUS.REJECTED).toBe('rejected');
    expect(ORG_STATUS.SUSPENDED).toBe('suspended');
  });

  it('NOTIFICATION_POLL_INTERVAL is a positive number', () => {
    expect(NOTIFICATION_POLL_INTERVAL).toBe(60000);
  });

  it('PAGE_SIZE is a positive number', () => {
    expect(PAGE_SIZE).toBe(20);
  });
});
