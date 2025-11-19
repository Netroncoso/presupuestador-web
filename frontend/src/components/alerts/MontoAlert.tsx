import { Alert, Text } from '@mantine/core';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { TipoAlertaMonto } from '../../services/alertaService';

interface Props {
  tipo: TipoAlertaMonto;
  totalFacturar: number;
}

const CONFIG = {
  ELEVADO: {
    title: 'MONTO ELEVADO - DAR AVISO',
    color: 'orange',
    mensaje: 'Se requiere revisión y aviso a las áreas correspondientes.',
  },
  CRITICO: {
    title: 'MONTO CRÍTICO - SOLICITAR GESTIÓN',
    color: 'red',
    mensaje: 'Se requiere gestión especial desde las áreas superiores.',
  },
} as const;

export const MontoAlert = ({ tipo, totalFacturar }: Props) => {
  if (!tipo) return null;

  const config = CONFIG[tipo];

  return (
    <Alert
      icon={<ShieldExclamationIcon style={{ width: 20, height: 20 }} />}
      title={config.title}
      color={config.color}
      radius="md"
      mb="xs"
    >
      <Text size="sm">
        <strong>Monto a facturar: ${totalFacturar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> - {config.mensaje}
      </Text>
    </Alert>
  );
};
