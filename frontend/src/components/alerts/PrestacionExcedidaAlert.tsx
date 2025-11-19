import { Alert, Text } from '@mantine/core';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Prestacion } from '../../types';

interface Props {
  prestacion: Prestacion;
}

export const PrestacionExcedidaAlert = ({ prestacion }: Props) => {
  return (
    <Alert
      icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />}
      title="⚠️ CANTIDAD ELEVADA"
      color="orange"
      radius="md"
      mb="xs"
    >
      <Text size="sm">
        <strong>{prestacion.prestacion}: {prestacion.cantidad} {prestacion.tipo_unidad}</strong> (sugerido: {prestacion.cant_total}) - 
        Cantidad superior a la recomendada.
      </Text>
    </Alert>
  );
};
