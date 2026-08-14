import { useMutation } from '@tanstack/react-query';
import { GlucoseIngestionDTO } from '@lifecode/shared';
import { getAuthHeaders } from '../lib/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const useGlucoseIngestion = () => {
  return useMutation({
    mutationFn: async (dto: GlucoseIngestionDTO) => {
      const response = await fetch(`${API_URL}/observations/glucose`, {
        method: 'POST',
        // Auth real (Bearer da sessão) + X-Tenant-ID obrigatório de multi-tenancy.
        headers: getAuthHeaders(),
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao registrar a medição.');
      }

      return await response.json();
    },
  });
};
