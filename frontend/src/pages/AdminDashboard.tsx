import React, { useState } from 'react';
import { Container, Title, Group, Button, Text, Tabs, ActionIcon } from '@mantine/core';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, BeakerIcon, BanknotesIcon, BriefcaseIcon, NewspaperIcon, BuildingOfficeIcon,BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import GestionInsumos from './admin/GestionInsumos';
import GestionPrestadores from './admin/GestionPrestadores';
import ServiciosPorPrestador from './admin/ServiciosPorPrestador';
import GestionServicios from './admin/GestionServicios';
import GestionSucursales from './admin/GestionSucursales';
import GestionUsuarios from './admin/GestionUsuarios';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false);

  return (
    <Container fluid  p="xl">
      <Group style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Title fw={500} order={2} c="red">Panel de Administración</Title>
        <Group gap="xs" align='baseline' justify='space-evenly'>
          <UserCircleIcon style={{ width: 20, height: 20 }} />
          <Text size="sm" tt="capitalize">{user?.username}</Text>
          {user?.username === 'admin' && (
            <ActionIcon   
              variant="transparent"
              size="md" 
              onClick={() => setUsuariosModalOpen(true)}
              title="Gestión de Usuarios">
              <UserPlusIcon style={{ width: 20, height: 20, color: 'gray' }} />
            </ActionIcon>
          )}
          <Button ml="md" variant="outline" color="red" size="xs" onClick={logout}>
            <ArrowRightStartOnRectangleIcon style={{ width: 20, height: 20, marginRight: 4 }} />Salir</Button>
        </Group>
      </Group>

      <Tabs defaultValue="insumos" variant="default" color="green">
        <Tabs.List>
          <Tabs.Tab value="insumos">
            <Group gap="xs">
              <BeakerIcon style={{ width: 20, height: 20 }} />
              Gestión de Insumos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="prestadores">
            <Group gap="xs">
              <BanknotesIcon style={{ width: 20, height: 20 }} />
              Gestión de Financiador
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="servicios-prestador">
            <Group gap="xs">
              <BriefcaseIcon style={{ width: 20, height: 20 }} />
              Servicios por Financiador
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="servicios">
            <Group gap="xs">
              <NewspaperIcon style={{ width: 20, height: 20 }} />
              Gestión de Servicios
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="sucursales">
            <Group gap="xs">
              <BuildingStorefrontIcon style={{ width: 20, height: 20 }} />
              Gestión de Sucursales
            </Group>
          </Tabs.Tab>
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
      </Tabs>

      <GestionUsuarios 
        opened={usuariosModalOpen} 
        onClose={() => setUsuariosModalOpen(false)} 
      />
    </Container>
  );
}
