import React, { useState } from 'react';
import { Title, Group, Button, Text, Tabs, ActionIcon } from '@mantine/core';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, BeakerIcon, CurrencyDollarIcon, BanknotesIcon, BriefcaseIcon, NewspaperIcon, BuildingOfficeIcon, BuildingStorefrontIcon, Cog6ToothIcon, BellAlertIcon, LifebuoyIcon, DocumentCurrencyDollarIcon } from '@heroicons/react/24/outline';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveContainer from '../components/ResponsiveContainer';

const ICON_SIZE = { width: 20, height: 20 };

import GestionInsumos from './admin/GestionInsumos';
import GestionFinanciadores from './admin/GestionFinanciadores';
import GestionConvenios from './admin/GestionConvenios';
import GestionServicios from './admin/GestionServicios';
import GestionSucursales from './admin/GestionSucursales';
import GestionUsuarios from './admin/GestionUsuarios';
import GestionConfiguracion from './admin/GestionConfiguracion';
import GestionEquipamientosBase from './admin/GestionEquipamientosBase';
import GestionTarifario from './admin/GestionTarifario';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);

  return (
    <ResponsiveContainer px={{ base: 'xs', sm: 'md', lg: 'xl' }} py="md">
      <Group style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Title fw={500} order={2} c="red">Panel de Administración</Title>
        <Group gap="xs" align='baseline' justify='space-evenly'>
          <UserCircleIcon style={ICON_SIZE} />
          <Text size="sm" tt="capitalize">{user?.username}</Text>
          {user?.username === 'admin' && (
            <ActionIcon   
              variant="transparent"
              size="md" 
              onClick={() => setUsuariosModalOpen(true)}
              title="Gestión de Usuarios">
              <UserPlusIcon style={{ ...ICON_SIZE, color: 'gray' }} />
            </ActionIcon>
          )}
          <Button ml="md" variant="outline" color="red" size="xs" onClick={logout}>
            <ArrowRightStartOnRectangleIcon style={{ ...ICON_SIZE, marginRight: 4 }} />Salir</Button>
        </Group>
      </Group>

      <Tabs defaultValue="sucursales" variant="default" color="green" mb="50">
        <Tabs.List grow>
          <Tabs.Tab value="sucursales">
            <Group gap="xs">
              <BuildingStorefrontIcon style={ICON_SIZE} />
              Sucursales
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="prestadores">
            <Group gap="xs">
              <BanknotesIcon style={ICON_SIZE} />
              Financiadores
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="convenios">
            <Group gap="xs">
              <BriefcaseIcon style={ICON_SIZE} />
              Convenios
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="tarifario">
            <Group gap="xs">
              <DocumentCurrencyDollarIcon style={ICON_SIZE} />
              Tarifario
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="insumos">
            <Group gap="xs">
              <BeakerIcon style={ICON_SIZE} />
              Insumos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="servicios">
            <Group gap="xs">
              <NewspaperIcon style={ICON_SIZE} />
              Servicios
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="equipamientos-base">
            <Group gap="xs">
              <LifebuoyIcon style={ICON_SIZE} />
              Equipamientos
            </Group>
          </Tabs.Tab>
          {user?.username === 'admin' && (
            <Tabs.Tab value="configuracion">
              <Group gap="xs">
                <Cog6ToothIcon style={ICON_SIZE} />
                Configuración
              </Group>
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="sucursales" pt="lg">
          <GestionSucursales />
        </Tabs.Panel>

        <Tabs.Panel value="prestadores" pt="lg">
          <GestionFinanciadores />
        </Tabs.Panel>

        <Tabs.Panel value="convenios" pt="lg">
          <GestionConvenios />
        </Tabs.Panel>

        <Tabs.Panel value="tarifario" pt="lg">
          <GestionTarifario />
        </Tabs.Panel>

        <Tabs.Panel value="insumos" pt="lg">
          <GestionInsumos />
        </Tabs.Panel>

        <Tabs.Panel value="servicios" pt="lg">
          <GestionServicios />
        </Tabs.Panel>

        <Tabs.Panel value="equipamientos-base" pt="lg">
          <GestionEquipamientosBase />
        </Tabs.Panel>

        {user?.username === 'admin' && (
          <Tabs.Panel value="configuracion" pt="lg">
            <GestionConfiguracion />
          </Tabs.Panel>
        )}
      </Tabs>

      <GestionUsuarios 
        opened={usuariosModalOpen} 
        onClose={() => setUsuariosModalOpen(false)} 
      />
    </ResponsiveContainer>
  );
}
