import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/services/api';

export async function getMemberProgress() {
  const res = await api.get('/members/my-progress');
  return res.data;
}

export function useMemberProgress({ enabled = true } = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ['member-progress'],
    queryFn: getMemberProgress,
    enabled,
    staleTime: 60_000,
  });

  const progress = data?.data ?? data ?? null;
  return { progress, isLoading };
}
