import React from 'react';
import { Modal, Text, Group, Button, Badge, Stack } from '@mantine/core';
import { PencilSquareIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

const ICON_SIZE = { width: 20, height: 20 };

interface ModalConfirmarEdicionProps {
  opened: boolean;
  onClose: () => void;
  presupuesto: {
    id: number;
    nombre: string;
    version: number;
    estado: string;
  };
  requiereNuevaVersion: boolean;
  onConfirmar: () => void;
  loading?: boolean;
}

export const ModalConfirmarEdicion: React.FC<ModalConfirmarEdicionProps> = ({
  opened,
  onClose,
  presupuesto,
  requiereNuevaVersion,
  onConfirmar,
  loading = false
}) => {
  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Confirmar Edición"
      size="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        <Text size="sm">
          <strong>Presupuesto:</strong> #{presupuesto.id} - {presupuesto.nombre}
        </Text>
        
        <Group gap="xs">
          <Badge variant="light" color="gray">
            Versión {presupuesto.version}
          </Badge>
          <Badge 
            variant="dot" 
            color={presupuesto.estado === 'borrador' ? 'blue' : presupuesto.estado === 'aprobado' ? 'green' : 'orange'}
          >
            {presupuesto.estado.toUpperCase()}
          </Badge>
        </Group>

        {requiereNuevaVersion ? (
          <>
            <Text size="sm" c="dimmed">
              Este presupuesto está <strong>{presupuesto.estado}</strong>. 
              Se creará una <strong>nueva versión {presupuesto.version + 1}</strong> en estado borrador para que puedas editarlo.
            </Text>
            <Text size="xs" c="orange">
              ⚠️ La versión actual se mantendrá sin cambios en el historial.
            </Text>
          </>
        ) : (
          <>
            <Text size="sm" c="dimmed">
              Este presupuesto ya está en <strong>borrador</strong>. 
              Puedes editarlo directamente sin crear una nueva versión.
            </Text>
            <Text size="xs" c="blue">
              ℹ️ Los cambios se guardarán en la versión actual.
            </Text>
          </>
        )}

        <Group justify="flex-end" gap="md" mt="md">
          <Button 
            variant="outline" 
            color="gray"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            color={requiereNuevaVersion ? "orange" : "blue"}
            size="sm"
            onClick={onConfirmar}
            loading={loading}
            leftSection={requiereNuevaVersion ? <DocumentDuplicateIcon style={ICON_SIZE} /> : <PencilSquareIcon style={ICON_SIZE} />}
          >
            {requiereNuevaVersion ? 'Crear Nueva Versión' : 'Editar Borrador'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
