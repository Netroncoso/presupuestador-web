import React, { useState, useRef } from 'react';
import { Modal, Text, Textarea, Group, Button, Badge, Flex } from '@mantine/core';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const ICON_SIZE = { width: 20, height: 20 };

interface ModalAuditoriaProps {
  opened: boolean;
  onClose: () => void;
  tipo: 'solicitar' | 'auditar';
  presupuesto: {
    id: number;
    nombre: string;
    dni?: string;
    costoTotal?: number;
    rentabilidad?: number;
    version?: number;
  };
  onConfirmar: (mensaje: string) => Promise<void>;
  loading?: boolean;
}

export const ModalAuditoria: React.FC<ModalAuditoriaProps> = ({
  opened,
  onClose,
  tipo,
  presupuesto,
  onConfirmar,
  loading = false
}) => {
  const [mensaje, setMensaje] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleConfirmar = async (accion?: string) => {
    const textoFinal = accion ? `${accion}: ${mensaje}` : mensaje;
    await onConfirmar(textoFinal.trim());
    setMensaje('');
  };

  const handleClose = () => {
    setMensaje('');
    onClose();
  };

  const renderSolicitar = () => (
    <>
      <Text size="sm" mb="md">
        <strong>Presupuesto:</strong> #{presupuesto.id} - {presupuesto.nombre}
      </Text>
      
      <Textarea
        ref={textareaRef}
        label="Mensaje para el auditor (opcional)"
        placeholder="Explica por qué necesitas esta auditoría o cualquier información relevante..."
        value={mensaje}
        onChange={(e) => setMensaje(e.currentTarget.value)}
        rows={3}
        mb="md"
      />

      <Group justify="flex-end" gap="md">
        <Button 
          variant="outline" 
          color="gray"
          size="xs"
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          color="orange" 
          size="xs"
          onClick={() => handleConfirmar()}
          loading={loading}
          leftSection={<ShieldCheckIcon style={ICON_SIZE} />}
        >
          Solicitar Auditoría
        </Button>
      </Group>
    </>
  );

  const renderAuditar = () => (
    <>
      <Text size="sm" mb="md">
        <strong>Paciente:</strong> {presupuesto.nombre} 
        {presupuesto.dni && ` (DNI: ${presupuesto.dni})`}
      </Text>
      
      {(presupuesto.costoTotal || presupuesto.rentabilidad) && (
        <Flex gap="md" mb="md">
          {presupuesto.costoTotal && (
            <Badge variant="light" color="blue">
              Costo: ${Number(presupuesto.costoTotal).toLocaleString()}
            </Badge>
          )}
          {presupuesto.rentabilidad && (
            <Badge 
              variant="dot" 
              color={Number(presupuesto.rentabilidad) >= 15 ? 'green' : 'red'}
            >
              Rentabilidad: {Number(presupuesto.rentabilidad).toFixed(1)}%
            </Badge>
          )}
          {presupuesto.version && (
            <Badge variant="light" color="gray">
              v{presupuesto.version}
            </Badge>
          )}
        </Flex>
      )}
      
      <Textarea
        label="Comentario (opcional)"
        placeholder="Agregar comentario sobre la decisión..."
        value={mensaje}
        onChange={(e) => setMensaje(e.currentTarget.value)}
        rows={3}
        mb="md"
      />

      <Group justify="center" gap="md">
        <Button 
          color="green" 
          size="xs"
          onClick={() => handleConfirmar('APROBADO')}
          loading={loading}
        >
          Aprobar
        </Button>
        <Button 
          color="red" 
          size="xs"
          onClick={() => handleConfirmar('RECHAZADO')}
          loading={loading}
        >
          Rechazar
        </Button>
      </Group>
    </>
  );

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose} 
      title={tipo === 'solicitar' ? 'Solicitar Auditoría' : `Auditar Presupuesto #${presupuesto.id}`}
      size="md"
    >
      {tipo === 'solicitar' ? renderSolicitar() : renderAuditar()}
    </Modal>
  );
};