import { useState, useEffect } from 'react';
import { FinanciadorZona } from '../types/financiadorZona';
import { financiadorZonasService } from '../services/financiadorZonasService';

export const useFinanciadorZonas = () => {
  const [zonas, setZonas] = useState<FinanciadorZona[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchZonas = async () => {
    setLoading(true);
    try {
      const data = await financiadorZonasService.getAll();
      setZonas(data);
    } catch (error) {
      console.error('Error fetching financiador zonas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createZona = async (zona: Omit<FinanciadorZona, 'id'>) => {
    try {
      const newZona = await financiadorZonasService.create(zona);
      setZonas(prev => [...prev, newZona]);
      return newZona;
    } catch (error) {
      console.error('Error creating zona:', error);
      throw error;
    }
  };

  const updateZona = async (id: string, zona: Partial<FinanciadorZona>) => {
    try {
      const updated = await financiadorZonasService.update(id, zona);
      setZonas(prev => prev.map(z => z.id === id ? updated : z));
      return updated;
    } catch (error) {
      console.error('Error updating zona:', error);
      throw error;
    }
  };

  const deleteZona = async (id: string) => {
    try {
      await financiadorZonasService.delete(id);
      setZonas(prev => prev.filter(z => z.id !== id));
    } catch (error) {
      console.error('Error deleting zona:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchZonas();
  }, []);

  return {
    zonas,
    loading,
    createZona,
    updateZona,
    deleteZona,
    refetch: fetchZonas
  };
};