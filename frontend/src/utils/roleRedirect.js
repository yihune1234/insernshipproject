import { ROLE_DASHBOARDS } from './constants';

export const getRoleRedirect = (role) => {
  return ROLE_DASHBOARDS[role] || '/login';
};
