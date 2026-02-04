import React, { useState } from 'react';
import { Tabs } from '@mantine/core';
import GestionReglasNegocio from './GestionReglasNegocio';
import GestionAlertasServicios from './GestionAlertasServicios';
import GestionAlertasPresupuesto from './GestionAlertasPresupuesto';

export default function GestionConfiguracion() {
  const [activeTab, setActiveTab] = useState<string | null>('reglas');

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List grow>
        <Tabs.Tab value="reglas">Reglas de Negocio</Tabs.Tab>
        <Tabs.Tab value="alertas-tipo">Alertas/ Tipo</Tabs.Tab>
        <Tabs.Tab value="alertas-presupuesto">Alertas/ Presupuesto</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="reglas" pt="md">
        <GestionReglasNegocio />
      </Tabs.Panel>

      <Tabs.Panel value="alertas-tipo" pt="md">
        <GestionAlertasServicios />
      </Tabs.Panel>

      <Tabs.Panel value="alertas-presupuesto" pt="md">
        <GestionAlertasPresupuesto />
      </Tabs.Panel>
    </Tabs>
  );
}
