import { useState, useEffect } from 'react';
import { ServicioFinanciador } from '../types';
import { financiadorZonasService } from '../services/financiadorZonasService';

export const useServiciosConvenio = (financiadorId: number | null, zonaFinanciadorId: number | null) => {
  const [servicios, setServicios] = useState<ServicioFinanciador[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServicios = async () => {
    if (!financiadorId || !zonaFinanciadorId) {
      setServicios([]);
      return;
    }

    setLoading(true);
    try {
      const data = await financiadorZonasService.getServiciosConvenio(financiadorId, zonaFinanciadorId);
      setServicios(data);
    } catch (error) {
      console.error('Error fetching servicios convenio:', error);
      setServicios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, [financiadorId, zonaFinanciadorId]);

  return {
    servicios,
    loading,
    refetch: fetchServicios
  };
};