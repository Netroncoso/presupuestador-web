import { Alert, Text } from '@mantine/core';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface Props {
  equipamiento: {
    nombre: string;
    tipo: string;
    cantidad: number;
    mensaje_alerta?: string;
    color_alerta?: string;
    cantidad_maxima?: number;
  };
}

export const EquipamientoExcedidoAlert = ({ equipamiento }: Props) => {
  const mensaje = equipamiento.mensaje_alerta || 'Cantidad superior a la recomendada.';
  const color = equipamiento.color_alerta || 'orange';
  
  return (
    <Alert
      icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />}
      title="⚠️ CANTIDAD ELEVADA"
      color={color}
      radius="md"
      mb="xs"
    >
      <Text size="sm">
        <strong>{equipamiento.nombre}</strong>
      </Text>
      <Text size="sm" mt="xs">{mensaje}</Text>
    </Alert>
  );
};
