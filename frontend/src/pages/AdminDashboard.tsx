import React, { useState } from 'react';
import { Container, Title, Group, Button, Text, Tabs, ActionIcon } from '@mantine/core';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, BeakerIcon, CurrencyDollarIcon, BanknotesIcon, BriefcaseIcon, NewspaperIcon, BuildingOfficeIcon, BuildingStorefrontIcon, Cog6ToothIcon, BellAlertIcon, LifebuoyIcon } from '@heroicons/react/24/outline';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';

const ICON_SIZE = { width: 20, height: 20 };

import GestionInsumos from './admin/GestionInsumos';
import GestionPrestadores from './admin/GestionPrestadores';
import ServiciosPorPrestador from './admin/ServiciosPorPrestador';
import GestionServicios from './admin/GestionServicios';
import GestionSucursales from './admin/GestionSucursales';
import GestionUsuarios from './admin/GestionUsuarios';
import GestionReglasNegocio from './admin/GestionReglasNegocio';
import GestionAlertasServicios from './admin/GestionAlertasServicios';
import GestionEquipamientos from './admin/GestionEquipamientos';
import GestionEquipamientosBase from './admin/GestionEquipamientosBase';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);

  return (
    <Container fluid  p="xl">
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

      <Tabs defaultValue="insumos" variant="default" color="green">
        <Tabs.List>
          <Tabs.Tab value="insumos">
            <Group gap="xs">
              <BeakerIcon style={ICON_SIZE} />
              Gestión de Insumos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="prestadores">
            <Group gap="xs">
              <BanknotesIcon style={ICON_SIZE} />
              Gestión de Financiador
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="servicios-prestador">
            <Group gap="xs">
              <BriefcaseIcon style={ICON_SIZE} />
              Servicios por Financiador
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="servicios">
            <Group gap="xs">
              <NewspaperIcon style={ICON_SIZE} />
              Gestión de Servicios
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="sucursales">
            <Group gap="xs">
              <BuildingStorefrontIcon style={ICON_SIZE} />
              Gestión de Sucursales
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="equipamientos-base">
            <Group gap="xs">
              <LifebuoyIcon style={ICON_SIZE} />
              Gestión de Equipamientos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="equipamientos">
            <Group gap="xs">
              <LifebuoyIcon style={ICON_SIZE} />
              Equipamientos por Financiador
            </Group>
          </Tabs.Tab>
          {user?.username === 'admin' && (
            <Tabs.Tab value="reglas">
              <Group gap="xs">
                <CurrencyDollarIcon style={ICON_SIZE} />
                Reglas de Negocio
              </Group>
            </Tabs.Tab>
          )}
          {user?.username === 'admin' && (
            <Tabs.Tab value="alertas">
              <Group gap="xs">
                <BellAlertIcon style={ICON_SIZE} />
                Alertas de Servicios
              </Group>
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="insumos" pt="md">
          <GestionInsumos />
        </Tabs.Panel>

        <Tabs.Panel value="prestadores" pt="md">
          <GestionPrestadores />
        </Tabs.Panel>

        <Tabs.Panel value="servicios-prestador" pt="md">
          <ServiciosPorPrestador />
        </Tabs.Panel>

        <Tabs.Panel value="servicios" pt="md">
          <GestionServicios />
        </Tabs.Panel>

        <Tabs.Panel value="sucursales" pt="md">
          <GestionSucursales />
        </Tabs.Panel>

        <Tabs.Panel value="equipamientos-base" pt="md">
          <GestionEquipamientosBase />
        </Tabs.Panel>

        <Tabs.Panel value="equipamientos" pt="md">
          <GestionEquipamientos />
        </Tabs.Panel>

        {user?.username === 'admin' && (
          <Tabs.Panel value="reglas" pt="md">
            <GestionReglasNegocio />
          </Tabs.Panel>
        )}

        {user?.username === 'admin' && (
          <Tabs.Panel value="alertas" pt="md">
            <GestionAlertasServicios />
          </Tabs.Panel>
        )}
      </Tabs>

      <GestionUsuarios 
        opened={usuariosModalOpen} 
        onClose={() => setUsuariosModalOpen(false)} 
      />
    </Container>
  );
}
