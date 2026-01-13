import { useEffect } from 'react';
import { api } from '../api/api';

interface FinanciadorInfo {
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  acuerdo_nombre?: string | null;
  Financiador?: string;
  id?: string;
  porcentaje_insumos?: number;
}

export const useFinanciador = (
  financiadorId: string | null,
  setFinanciadorInfo: (info: FinanciadorInfo) => void
) => {
  useEffect(() => {
    const cargarInfoFinanciador = async () => {
      if (financiadorId) {
        try {
          const response = await api.get(`/prestaciones/financiador/${financiadorId}/info`);
          setFinanciadorInfo(response.data || {});
        } catch (error) {
          console.error('Error cargando información del financiador:', error);
          setFinanciadorInfo({});
        }
      } else {
        setFinanciadorInfo({});
      }
    };

    cargarInfoFinanciador();
  }, [financiadorId]); // eslint-disable-line react-hooks/exhaustive-deps
};
