import React, { useState, useRef } from 'react';
import { Modal, Text, Textarea, Group, Button, Badge, Flex } from '@mantine/core';
import { ShieldCheckIcon,CheckBadgeIcon } from '@heroicons/react/24/outline';

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
      <Text size="sm" mb="xs">
        <strong>Presupuesto:</strong> #{presupuesto.id} - {presupuesto.nombre}
      </Text>
      
      <Text size="sm" c="orange" mb="md">
        ⚠️ Este presupuesto no cumple con las reglas automáticas y requiere revisión gerencial.
      </Text>
      
      <Textarea
        ref={textareaRef}
        label="Mensaje para la Gerencia (opcional)"
        placeholder="Explica por qué necesitas esta auditoría o cualquier información relevante..."
        description="Este mensaje será visible para los auditores"
        value={mensaje}
        onChange={(e) => setMensaje(e.currentTarget.value)}
        rows={6}
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
          Seguir Editando
        </Button>
        <Button 
          color="orange" 
          size="xs"
          onClick={() => handleConfirmar()}
          loading={loading}
          rightSection={<ShieldCheckIcon style={ICON_SIZE} />}
        >
          Enviar a Auditoría
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
        label="Mensaje"
        placeholder="Breve mensaje de tu auditoria..."
        value={mensaje}
        onChange={(e) => setMensaje(e.currentTarget.value)}
        rows={6}
        mb="md"
        required
        error={!mensaje.trim() && 'El comentario es obligatorio'}
      />

      <Group justify="right" gap="md">
        <Button 
          color="red" 
          size="xs"
          onClick={() => handleConfirmar('RECHAZADO')}
          loading={loading}
          variant='outline'
          disabled={!mensaje.trim() || loading}
        >
          Rechazar
        </Button>
                <Button 
          color="green" 
          size="xs"
          onClick={() => handleConfirmar('APROBADO')}
          loading={loading}
          rightSection={<CheckBadgeIcon style={ICON_SIZE} />}
          disabled={!mensaje.trim() || loading}
        >
          Aprobar
        </Button>
      </Group>
    </>
  );

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose} 
      title={tipo === 'solicitar' ? 'Solicitar Auditoría' : `Auditar Presupuesto #${presupuesto.id}`}
      size="lg"
      overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,}}
    >
      {tipo === 'solicitar' ? renderSolicitar() : renderAuditar()}
    </Modal>
  );
};