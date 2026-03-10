import { useState, useEffect } from 'react';
import { ServicioTarifario } from '../types';
import { tarifarioValoresService } from '../services/tarifarioValoresService';

export const useServiciosTarifario = (zonaTarifarioId: number | null) => {
  const [servicios, setServicios] = useState<ServicioTarifario[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServicios = async () => {
    if (!zonaTarifarioId) {
      setServicios([]);
      return;
    }

    setLoading(true);
    try {
      const data = await tarifarioValoresService.getServiciosPorZona(zonaTarifarioId);
      setServicios(data);
    } catch (error) {
      console.error('Error fetching servicios tarifario:', error);
      setServicios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, [zonaTarifarioId]);

  return {
    servicios,
    loading,
    refetch: fetchServicios
  };
};