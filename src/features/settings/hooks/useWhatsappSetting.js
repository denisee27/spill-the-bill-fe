import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/services/api';

export const useWhatsappSetting = () =>
  useQuery({
    queryKey: ['whatsapp-setting'],
    queryFn: () => api.get('/whatsapp/settings').then((r) => r.data?.data),
    staleTime: 5 * 60_000,
  });
