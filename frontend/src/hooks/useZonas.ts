// ============================================================================
// HOOK: useZonas
// ============================================================================

import { useState, useEffect } from 'react';
import api from '../api/api';

interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: number;
  es_zona_principal?: number;
}

export const useZonas = (sucursalId: number | null) => {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(false);
  const [zonaPrincipal, setZonaPrincipal] = useState<Zona | null>(null);

  useEffect(() => {
    // Limpiar inmediatamente al cambiar sucursal
    setZonas([]);
    setZonaPrincipal(null);
    
    if (sucursalId) {
      cargarZonas();
    }
  }, [sucursalId]);

  const cargarZonas = async () => {
    if (!sucursalId) return;

    try {
      setLoading(true);
      const response = await api.get(`/sucursales/${sucursalId}/zonas`);
      setZonas(response.data);

      // Identificar zona principal
      const principal = response.data.find((z: Zona) => z.es_zona_principal === 1);
      setZonaPrincipal(principal || null);
    } catch (error) {
      console.error('Error al cargar zonas:', error);
      setZonas([]);
      setZonaPrincipal(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    zonas,
    loading,
    zonaPrincipal,
    cargarZonas
  };
};
