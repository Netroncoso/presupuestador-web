import React, { useState, useEffect } from 'react';
import { UserPlusIcon} from '@heroicons/react/24/solid';
import { Table, Button, TextInput, Select, Modal, Group, Text, ActionIcon, Badge, Switch } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Usuario {
  id: number;
  username: string;
  rol: string;
  activo: number;
}

interface GestionUsuariosProps {
  opened: boolean;
  onClose: () => void;
}

export default function GestionUsuarios({ opened, onClose }: GestionUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', rol: 'user' });

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        console.error('Error fetching usuarios:', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (opened) fetchUsuarios();
  }, [opened]);

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:4000/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      setCreateModal(false);
      setFormData({ username: '', password: '', rol: 'user' });
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
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
      <Modal opened={opened} onClose={onClose} title="Gestión de Usuarios" size="lg">
        <Group style={{ marginBottom: 16 }}>
          <Button leftIcon={<UserPlusIcon width={18} height={18} />} onClick={() => setCreateModal(true)}>
          Nuevo Usuario
          </Button>
        </Group>

        <Table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.username}</td>
                <td>
                  <Badge color={usuario.rol === 'admin' ? 'red' : 'blue'}>
                    {usuario.rol}
                  </Badge>
                </td>
                <td>
                  {usuario.username === 'admin' ? (
                    <text color="none">-</text>
                  ) : (
                    <Switch
                      checked={usuario.activo === 1}
                      onChange={() => toggleActivo(usuario.id, usuario.activo)}
                      size="sm"
                    />
                  )}
                </td>
                <td>
                  <Group spacing={4}>
                    {usuario.username !== 'admin' && (
                      <>
                        <ActionIcon
                          color="blue"
                          onClick={() => {
                            setSelectedUser(usuario);
                            setFormData({ username: usuario.username, password: '', rol: usuario.rol });
                            setEditModal(true);
                          }}
                        >
                          <PencilSquareIcon width={16} height={16} />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          onClick={() => handleDelete(usuario.id)}
                        >
                          <TrashIcon width={16} height={16} />
                        </ActionIcon>
                      </>
                    )}
                    {usuario.username === 'admin' && (
                      <Text size="xs" c="dimmed">Usuario protegido</Text>
                    )}
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal>

      <Modal opened={createModal} onClose={() => setCreateModal(false)} title="Crear Usuario">
        <TextInput
          label="Usuario"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          mb="sm"
        />
        <TextInput
          label="Contraseña"
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
            { value: 'admin', label: 'Administrador' }
          ]}
          mb="md"
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
            { value: 'admin', label: 'Administrador' }
          ]}
          mb="md"
        />
        <Group>
          <Button onClick={handleUpdate}>Actualizar</Button>
          <Button variant="outline" onClick={() => setEditModal(false)}>Cancelar</Button>
        </Group>
      </Modal>
    </>
  );
}