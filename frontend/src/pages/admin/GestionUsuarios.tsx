import React, { useState, useEffect } from 'react';
import { UserPlusIcon} from '@heroicons/react/24/solid';
import { Table, Button, TextInput, Select, Modal, Group, Text, ActionIcon, Switch } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Usuario, Sucursal } from '../../types';

interface UsuarioLocal extends Omit<Usuario, 'activo'> {
  activo: number;
}

interface GestionUsuariosProps {
  opened: boolean;
  onClose: () => void;
}

export default function GestionUsuarios({ opened, onClose }: GestionUsuariosProps) {
  const [usuarios, setUsuarios] = useState<UsuarioLocal[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioLocal | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', rol: 'user', sucursal_id: '' });

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const usuarios = data.data || data;
        setUsuarios(Array.isArray(usuarios) ? usuarios : []);
      } else {
        console.error('Error fetching usuarios:', response.status);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setUsuarios([]);
    }
  };

  const fetchSucursales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/sucursales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSucursales(data);
      }
    } catch (error) {
      console.error('Error fetching sucursales:', error);
    }
  };

  useEffect(() => {
    if (opened) {
      fetchUsuarios();
      fetchSucursales();
    }
  }, [opened]);

  const handleCreate = async () => {
    if (!formData.username || !formData.password || !formData.rol || !formData.sucursal_id) {
      alert('Todos los campos son obligatorios');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setCreateModal(false);
        setFormData({ username: '', password: '', rol: 'user', sucursal_id: '' });
        fetchUsuarios();
      } else {
        const data = await response.json();
        alert(data.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear usuario');
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/admin/usuarios/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      setEditModal(false);
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleActivo = async (id: number, activo: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/admin/usuarios/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: activo ? 0 : 1 })
      });
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/admin/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Modal opened={opened} onClose={onClose} title="Gestión de Usuarios" size="xl">
        <Group style={{ marginBottom: 16 }}>
          <Button leftSection={<UserPlusIcon width={18} height={18} />} onClick={() => setCreateModal(true)}>
          Nuevo Usuario
          </Button>
        </Group>

        <Table striped="odd" highlightOnHover layout="fixed" stickyHeader>
          <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
            <Table.Tr>
              <Table.Th>Usuario</Table.Th>
              <Table.Th>Rol</Table.Th>
              <Table.Th>Sucursal</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {usuarios.map((usuario) => (
              <Table.Tr key={usuario.id}>
                <Table.Td>{usuario.username}</Table.Td>
                <Table.Td>
                  <Text size="sm" c={usuario.rol === 'admin' ? 'red' : 'blue'}>
                    {usuario.rol.replace('gerencia_', 'G. ').replace('_', ' ')}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{usuario.sucursal_nombre || 'Sin asignar'}</Text>
                </Table.Td>
                <Table.Td>
                  {usuario.username === 'admin' ? (
                    <Text size="xs" c="dimmed">-</Text>
                  ) : (
                    <Switch
                      checked={usuario.activo === 1}
                      onChange={() => toggleActivo(usuario.id, usuario.activo)}
                      size="sm"
                    />
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {usuario.username !== 'admin' && (
                      <>
                        <ActionIcon
                          variant="transparent"
                          color="blue"
                          onClick={() => {
                            setSelectedUser(usuario);
                            setFormData({ 
                              username: usuario.username, 
                              password: '', 
                              rol: usuario.rol,
                              sucursal_id: usuario.sucursal_id?.toString() || ''
                            });
                            setEditModal(true);
                          }}
                        >
                          <PencilSquareIcon width={20} height={20} />
                        </ActionIcon>
                        <ActionIcon
                          variant="transparent"
                          color="red"
                          onClick={() => handleDelete(usuario.id)}
                        >
                          <TrashIcon width={20} height={20} />
                        </ActionIcon>
                      </>
                    )}
                    {usuario.username === 'admin' && (
                      <Text size="xs" c="dimmed">Usuario protegido</Text>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Modal>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title="Crear Usuario">
        <TextInput
          label="Usuario"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          mb="sm"
          required
        />
        <TextInput
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          mb="sm"
          required
        />
        <Select
          label="Rol"
          value={formData.rol}
          onChange={(value) => setFormData({ ...formData, rol: value || 'user' })}
          data={[
            { value: 'user', label: 'Usuario' },
            { value: 'gerencia_prestacional', label: 'Gerencia Prestacional' },
            { value: 'gerencia_comercial', label: 'Gerencia Comercial' },
            { value: 'gerencia_financiera', label: 'Gerencia Financiera' },
            { value: 'gerencia_general', label: 'Gerencia General' },
            { value: 'operador_carga', label: 'Operador de Carga' },
            { value: 'admin', label: 'Administrador' }
          ]}
          mb="sm"
          required
        />
        <Select
          label="Sucursal"
          placeholder="Seleccionar sucursal"
          value={formData.sucursal_id}
          onChange={(value) => setFormData({ ...formData, sucursal_id: value || '' })}
          data={sucursales.map(s => ({ value: s.ID.toString(), label: s.Sucursales_mh }))}
          mb="md"
          required
        />
        <Group>
          <Button onClick={handleCreate}>Crear</Button>
          <Button variant="outline" onClick={() => setCreateModal(false)}>Cancelar</Button>
        </Group>
      </Modal>

      <Modal opened={editModal} onClose={() => setEditModal(false)} title="Editar Usuario">
        <TextInput
          label="Usuario"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          mb="sm"
        />
        <TextInput
          label="Nueva Contraseña (dejar vacío para no cambiar)"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          mb="sm"
        />
        <Select
          label="Rol"
          value={formData.rol}
          onChange={(value) => setFormData({ ...formData, rol: value || 'user' })}
          data={[
            { value: 'user', label: 'Usuario' },
            { value: 'gerencia_prestacional', label: 'Gerencia Prestacional' },
            { value: 'gerencia_comercial', label: 'Gerencia Comercial' },
            { value: 'gerencia_financiera', label: 'Gerencia Financiera' },
            { value: 'gerencia_general', label: 'Gerencia General' },
            { value: 'operador_carga', label: 'Operador de Carga' },
            { value: 'admin', label: 'Administrador' }
          ]}
          mb="sm"
        />
        <Select
          label="Sucursal"
          placeholder="Seleccionar sucursal"
          value={formData.sucursal_id}
          onChange={(value) => setFormData({ ...formData, sucursal_id: value || '' })}
          data={sucursales.map(s => ({ value: s.ID.toString(), label: s.Sucursales_mh }))}
          mb="md"
          clearable
        />
        <Group>
          <Button onClick={handleUpdate}>Actualizar</Button>
          <Button variant="outline" onClick={() => setEditModal(false)}>Cancelar</Button>
        </Group>
      </Modal>
    </>
  );
}
