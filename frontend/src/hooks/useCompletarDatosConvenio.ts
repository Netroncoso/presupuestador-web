import { useState, useCallback } from 'react';
import { api } from '../api/api';
import { notifications } from '@mantine/notifications';

interface DatosConvenio {
  nombre: string;
  dni: string;
  sucursal: string;
  sucursal_id: number;
  zona_tarifario_id?: number;
  zona_financiador_id?: number;
  ultimo_presupuesto: string;
}

interface ResultadoCompletarDatos {
  encontrado: boolean;
  datos?: DatosConvenio;
  mensaje: string;
}

export const useCompletarDatosConvenio = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completarDatos = useCallback(async (
    financiadorId: string, 
    dni: string
  ): Promise<ResultadoCompletarDatos | null> => {
    if (!financiadorId || !dni) {
      return null;
    }

    // Validar DNI
    if (!/^\d{7,8}$/.test(dni)) {
      setError('El DNI debe tener 7-8 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/financiador/${financiadorId}/completar-datos`, {
        params: { dni }
      });

      const resultado: ResultadoCompletarDatos = response.data;

      if (resultado.encontrado) {
        notifications.show({
          title: 'Datos Completados',
          message: resultado.mensaje,
          color: 'green'
        });
      } else {
        notifications.show({
          title: 'Sin Historial',
          message: resultado.mensaje,
          color: 'blue'
        });
      }

      return resultado;
    } catch (err) {
      console.error('Error completando datos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al completar datos';
      setError(errorMessage);
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    completarDatos,
    loading,
    error,
    limpiarError
  };
};