import React, { useState } from 'react';
import { Tabs } from '@mantine/core';
import GestionServiciosTarifario from './GestionServiciosTarifario';
import ValoresPorZona from './ValoresPorZona';

export default function GestionTarifario() {
  const [activeTab, setActiveTab] = useState<string | null>('servicios');

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List grow>
        <Tabs.Tab value="servicios">Servicios</Tabs.Tab>
        <Tabs.Tab value="valores">Valores por Zona</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="servicios" pt="md">
        <GestionServiciosTarifario />
      </Tabs.Panel>

      <Tabs.Panel value="valores" pt="md">
        <ValoresPorZona />
      </Tabs.Panel>
    </Tabs>
  );
}
