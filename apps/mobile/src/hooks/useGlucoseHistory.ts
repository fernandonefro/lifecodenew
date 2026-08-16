import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '../lib/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface GlucoseHistoryItem {
  id: string;
  value: number;
  unit: string;
  measuredAt: string;
  context: string | null;
  sourceType: string;
}

/** Histórico de glicemias do paciente (mais recentes primeiro). */
export const useGlucoseHistory = (patientId?: string | null) => {
  return useQuery<GlucoseHistoryItem[]>({
    queryKey: ['glucose-history', patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const response = await fetch(`${API_URL}/observations/glucose?patientId=${patientId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao carregar o histórico de medições.');
      }
      return response.json();
    },
  });
};
