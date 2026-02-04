import React, { useState, useEffect } from 'react';
import { Tabs, Select, Stack } from '@mantine/core';
import { api } from '../../api/api';
import { notifications } from '@mantine/notifications';
import ServiciosPorFinanciador from './ServiciosPorFinanciador';
import GestionEquipamientos from './GestionEquipamientos';

interface Financiador {
  id: string;
  Financiador: string;
}

export default function GestionConvenios() {
  const [activeTab, setActiveTab] = useState<string | null>('servicios');
  const [financiadores, setFinanciadores] = useState<Financiador[]>([]);
  const [financiadorId, setFinanciadorId] = useState<string>('');

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  useEffect(() => {
    cargarFinanciadores();
  }, []);

  const cargarFinanciadores = async () => {
    try {
      const response = await api.get('/admin/financiadores');
      setFinanciadores(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar financiadores',
        color: 'red'
      });
    }
  };

  return (
    <Stack gap="md">
      <Select
        label="Seleccionar Financiador"
        placeholder="Seleccione un financiador"
        value={financiadorId}
        onChange={(value) => setFinanciadorId(value || '')}
        data={financiadores.map(f => ({
          value: String(f.id),
          label: formatName(f.Financiador)
        }))}
        searchable
        clearable
      />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="servicios">Servicios</Tabs.Tab>
          <Tabs.Tab value="equipamientos">Equipamientos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="servicios" pt="md">
          <ServiciosPorFinanciador financiadorId={financiadorId} />
        </Tabs.Panel>

        <Tabs.Panel value="equipamientos" pt="md">
          <GestionEquipamientos financiadorId={financiadorId} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
