import React, { useState } from 'react';
import { Container, Title, Group, Button, Text, Tabs, ActionIcon } from '@mantine/core';
import { Cog8ToothIcon } from '@heroicons/react/24/solid';
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
        <Title order={2} c="red">Panel de Administración</Title>
        <Group>
          <Text size="sm">Admin: {user?.username}</Text>
          {user?.username === 'admin' && (
            <ActionIcon 
              variant="transparent"
              size="sm" 
              onClick={() => setUsuariosModalOpen(true)}
              title="Gestión de Usuarios"
            >
              <Cog8ToothIcon  />
            </ActionIcon>
          )}
          <Button variant="outline" size="sm" onClick={logout}>Cerrar Sesión</Button>
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