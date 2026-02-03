// ============================================================================
// HOOK: useTarifario
// ============================================================================

import { useState, useEffect } from 'react';
import api from '../api/api';

interface TarifarioServicio {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_unidad?: string;
  activo: number;
  valores?: ValorVigente[] | null;
}

interface ValorVigente {
  orden: number;
  costo: number;
  dias_desactualizacion: number;
  alerta_desactualizado: boolean;
}

interface ValoresVigentesResponse {
  servicio_id: number;
  zona_id: number;
  fecha_inicio: string;
  valores: ValorVigente[];
}

export const useTarifario = (zonaId?: number | null) => {
  const [servicios, setServicios] = useState<TarifarioServicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [markup, setMarkup] = useState<number>(50);

  // Cargar servicios activos con valores si hay zona
  const cargarServicios = async () => {
    try {
      setLoading(true);
      const url = zonaId ? `/tarifario-servicio/activos?zona_id=${zonaId}` : '/tarifario-servicio/activos';
      const response = await api.get(url);
      setServicios(response.data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener valores vigentes por servicio y zona
  const obtenerValoresVigentes = async (servicioId: number, zonaId: number | null): Promise<ValoresVigentesResponse | null> => {
    if (zonaId === null || zonaId === undefined || !zonaId) {
      return null;
    }
    
    try {
      const response = await api.get(`/tarifario-servicio/${servicioId}/valores-vigentes?zona_id=${zonaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener valores vigentes:', error);
      return null;
    }
  };

  // Cargar markup configurado
  const cargarMarkup = async () => {
    try {
      const response = await api.get('/tarifario-servicio/markup');
      setMarkup(response.data.markup);
    } catch (error) {
      console.error('Error al cargar markup:', error);
    }
  };

  // Calcular valor a facturar
  const calcularValorFacturar = (costo: number): number => {
    return costo * (1 + markup / 100);
  };

  useEffect(() => {
    cargarMarkup();
    if (zonaId) {
      cargarServicios();
    }
  }, [zonaId]);

  return {
    servicios,
    loading,
    markup,
    cargarServicios,
    calcularValorFacturar
  };
};
