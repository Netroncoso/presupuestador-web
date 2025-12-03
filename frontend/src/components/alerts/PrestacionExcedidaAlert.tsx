import { Alert, Text } from '@mantine/core';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Prestacion } from '../../types';

interface Props {
  prestacion: Prestacion;
}

export const PrestacionExcedidaAlert = ({ prestacion }: Props) => {
  const mensaje = (prestacion as any).mensaje_alerta || 'Cantidad superior a la recomendada.';
  const color = (prestacion as any).color_alerta || 'orange';
  
  return (
    <Alert
      icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />}
      title="⚠️ CANTIDAD ELEVADA"
      color={color}
      radius="md"
      mb="xs"
    >
      <Text size="sm">
        <strong>{prestacion.prestacion}: {prestacion.cantidad} {prestacion.tipo_unidad}</strong>
      </Text>
      <Text size="sm" mt="xs">{mensaje}</Text>
    </Alert>
  );
};
