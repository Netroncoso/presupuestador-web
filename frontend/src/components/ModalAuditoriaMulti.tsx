import React, { useState } from 'react';
import { Modal, Button, Textarea, Group, Text, Stack, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../api/api';
import { Presupuesto, RolUsuario } from '../types';

interface ModalAuditoriaMultiProps {
  opened: boolean;
  onClose: () => void;
  presupuesto: Presupuesto | null;
  rol: RolUsuario;
  onSuccess: () => void;
}

export const ModalAuditoriaMulti: React.FC<ModalAuditoriaMultiProps> = ({
  opened,
  onClose,
  presupuesto,
  rol,
  onSuccess
}) => {
  const [comentario, setComentario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [gerenciaDestino, setGerenciaDestino] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setComentario('');
    setMotivo('');
    setGerenciaDestino(null);
    onClose();
  };

  const ejecutarAccion = async (endpoint: string, body: any) => {
    setLoading(true);
    try {
      await api.put(endpoint, body);
      notifications.show({
        title: 'Éxito',
        message: 'Acción ejecutada correctamente',
        color: 'green'
      });
      onSuccess();
      handleClose();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Error al ejecutar acción',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const aprobar = () => {
    const gerenciaPath = rol === 'gerencia_administrativa' ? 'administrativa' 
      : rol === 'gerencia_prestacional' ? 'prestacional'
      : 'general';
    ejecutarAccion(`/auditoria-multi/${gerenciaPath}/aprobar/${presupuesto?.idPresupuestos}`, { comentario });
  };

  const aprobarCondicional = () => {
    if (!motivo || motivo.length < 10) {
      notifications.show({
        title: 'Error',
        message: 'El motivo debe tener al menos 10 caracteres',
        color: 'red'
      });
      return;
    }
    const gerenciaPath = rol === 'gerencia_administrativa' ? 'administrativa' 
      : rol === 'gerencia_prestacional' ? 'prestacional'
      : 'general';
    ejecutarAccion(`/auditoria-multi/${gerenciaPath}/aprobar-condicional/${presupuesto?.idPresupuestos}`, { motivo });
  };

  const rechazar = () => {
    if (!comentario) {
      notifications.show({
        title: 'Error',
        message: 'El comentario es obligatorio',
        color: 'red'
      });
      return;
    }
    const gerenciaPath = rol === 'gerencia_administrativa' ? 'administrativa' 
      : rol === 'gerencia_prestacional' ? 'prestacional'
      : 'general';
    ejecutarAccion(`/auditoria-multi/${gerenciaPath}/rechazar/${presupuesto?.idPresupuestos}`, { comentario });
  };

  const derivar = () => {
    ejecutarAccion(`/auditoria-multi/administrativa/derivar/${presupuesto?.idPresupuestos}`, { comentario });
  };

  const observar = () => {
    if (!comentario) {
      notifications.show({
        title: 'Error',
        message: 'El comentario es obligatorio',
        color: 'red'
      });
      return;
    }
    ejecutarAccion(`/auditoria-multi/prestacional/observar/${presupuesto?.idPresupuestos}`, { comentario });
  };

  const escalar = () => {
    if (!motivo) {
      notifications.show({
        title: 'Error',
        message: 'El motivo es obligatorio',
        color: 'red'
      });
      return;
    }
    ejecutarAccion(`/auditoria-multi/prestacional/escalar/${presupuesto?.idPresupuestos}`, { motivo });
  };

  const devolver = () => {
    if (!gerenciaDestino || !comentario) {
      notifications.show({
        title: 'Error',
        message: 'Debe seleccionar gerencia destino y agregar comentario',
        color: 'red'
      });
      return;
    }
    ejecutarAccion(`/auditoria-multi/general/devolver/${presupuesto?.idPresupuestos}`, { gerenciaDestino, comentario });
  };

  if (!presupuesto) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={600} size="lg">Auditar Presupuesto</Text>}
      size="lg"
    >
      <Stack gap="md">
        <div>
          <Text fw={500}>Paciente: {presupuesto.Nombre_Apellido}</Text>
          <Text size="sm" c="dimmed">DNI: {presupuesto.DNI}</Text>
          <Text size="sm" c="dimmed">Costo: ${Number(presupuesto.costo_total || 0).toLocaleString()}</Text>
          <Text size="sm" c="dimmed">Rentabilidad: {Number(presupuesto.rentabilidad || 0).toFixed(1)}%</Text>
        </div>

        <Textarea
          label="Comentario (opcional)"
          placeholder="Agregar comentario..."
          value={comentario}
          onChange={(e) => setComentario(e.currentTarget.value)}
          minRows={3}
        />

        {/* GERENCIA ADMINISTRATIVA */}
        {rol === 'gerencia_administrativa' && (
          <Group grow>
            <Button color="green" onClick={aprobar} loading={loading}>
              Aprobar
            </Button>
            <Button color="yellow" onClick={aprobarCondicional} loading={loading}>
              Aprobar Condicional
            </Button>
            <Button color="blue" onClick={derivar} loading={loading}>
              Derivar a G. Prestacional
            </Button>
            <Button color="red" onClick={rechazar} loading={loading}>
              Rechazar
            </Button>
          </Group>
        )}

        {/* GERENCIA PRESTACIONAL */}
        {rol === 'gerencia_prestacional' && (
          <>
            <Group grow>
              <Button color="green" onClick={aprobar} loading={loading}>
                Aprobar
              </Button>
              <Button color="yellow" onClick={aprobarCondicional} loading={loading}>
                Aprobar Condicional
              </Button>
              <Button color="red" onClick={rechazar} loading={loading}>
                Rechazar
              </Button>
            </Group>
            <Group grow>
              <Button color="orange" onClick={observar} loading={loading}>
                Observar (Devolver a Usuario)
              </Button>
              <Button color="violet" onClick={escalar} loading={loading}>
                Escalar a G. General
              </Button>
            </Group>
            <Textarea
              label="Motivo para Escalar (obligatorio)"
              placeholder="Motivo del escalamiento..."
              value={motivo}
              onChange={(e) => setMotivo(e.currentTarget.value)}
              minRows={2}
            />
          </>
        )}

        {/* GERENCIA GENERAL */}
        {rol === 'gerencia_general' && (
          <>
            <Group grow>
              <Button color="green" onClick={aprobar} loading={loading}>
                Aprobar
              </Button>
              <Button color="yellow" onClick={aprobarCondicional} loading={loading}>
                Aprobar Condicional
              </Button>
              <Button color="red" onClick={rechazar} loading={loading}>
                Rechazar
              </Button>
            </Group>
            <Select
              label="Devolver a Gerencia"
              placeholder="Seleccionar gerencia"
              data={[
                { value: 'administrativa', label: 'G. Administrativa' },
                { value: 'prestacional', label: 'G. Prestacional' }
              ]}
              value={gerenciaDestino}
              onChange={setGerenciaDestino}
            />
            <Button color="blue" onClick={devolver} loading={loading} fullWidth>
              Devolver a Gerencia Seleccionada
            </Button>
            <Textarea
              label="Motivo para Aprobación Condicional"
              placeholder="Motivo (mínimo 10 caracteres)..."
              value={motivo}
              onChange={(e) => setMotivo(e.currentTarget.value)}
              minRows={2}
            />
          </>
        )}
      </Stack>
    </Modal>
  );
};
