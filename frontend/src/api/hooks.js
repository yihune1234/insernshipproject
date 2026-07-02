import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import * as authApi from './auth';
import * as holderApi from './holder';

export function useAuthStatus(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: authApi.getStatus,
    enabled,
  });
}

export function useCredentials() {
  return useQuery({
    queryKey: ['holder', 'credentials'],
    queryFn: holderApi.getCredentials,
  });
}

export function useCredentialDetail(id) {
  return useQuery({
    queryKey: ['holder', 'credential', id],
    queryFn: () => holderApi.getCredential(id),
    enabled: !!id,
  });
}
