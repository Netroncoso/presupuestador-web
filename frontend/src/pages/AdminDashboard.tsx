import React, { useState } from 'react';
import { Container, Title, Group, Button, Text, Tabs, ActionIcon } from '@mantine/core';
import { ArrowRightStartOnRectangleIcon,UserCircleIcon } from '@heroicons/react/24/outline';
import { UserPlusIcon} from '@heroicons/react/24/solid';
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
    <Container size="xl" p="md">
      <Group style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Title fw={500} order={2} c="red">Panel de Administración</Title>
        <Group spacing="xs">
          <UserCircleIcon className="w-5 h-5 mr-0"/>
          <Text size="sm" tt="capitalize">{user?.username}</Text>
          {user?.username === 'admin' && (
            <ActionIcon 
              variant="transparent"
              size="md" 
              onClick={() => setUsuariosModalOpen(true)}
              title="Gestión de Usuarios">
              <UserPlusIcon className="w-5 h-5 m-0"/>
            </ActionIcon>
          )}
          <Button ml="md" variant="outline" color="red" size="xs" onClick={logout}>
            <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-1"/>Salir</Button>
        </Group>
      </Group>

      <Tabs defaultValue="insumos" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="insumos">Gestión de Insumos</Tabs.Tab>
          <Tabs.Tab value="prestadores">Gestión de Financiador</Tabs.Tab>
          <Tabs.Tab value="servicios-prestador">Servicios por Financiador</Tabs.Tab>
          <Tabs.Tab value="servicios">Gestión de Servicios</Tabs.Tab>
          <Tabs.Tab value="sucursales">Gestión de Sucursales</Tabs.Tab>
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