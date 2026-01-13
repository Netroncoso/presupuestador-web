import { Alert, Text } from '@mantine/core';
import { ExclamationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { TipoAlertaUtilidad } from '../../services/alertaService';
import { numberFormat } from '../../utils/numberFormat';

interface Props {
  tipo: TipoAlertaUtilidad;
  utilidad: number;
}

const CONFIG = {
  CRITICA: {
    icon: ExclamationCircleIcon,
    title: 'UTILIDAD CRÍTICA',
    color: 'red',
    mensaje: 'Utilidad extremadamente baja. Verifica costos y precios.',
  },
  BAJA: {
    icon: ExclamationTriangleIcon,
    title: 'UTILIDAD BAJA',
    color: 'orange',
    mensaje: 'Utilidad por debajo del objetivo. Considera ajustar valores.',
  },
  BUENA: {
    icon: CheckCircleIcon,
    title: 'UTILIDAD BUENA',
    color: 'green',
    mensaje: 'Utilidad dentro del rango esperado. ¡Buen trabajo!',
  },
  EXCELENTE: {
    icon: CheckBadgeIcon,
    title: 'UTILIDAD EXCELENTE',
    color: 'violet',
    mensaje: '¡Excelente margen de ganancia!',
  },
} as const;

export const UtilidadAlert = ({ tipo, utilidad }: Props) => {
  const config = CONFIG[tipo];
  
  if (!config) {
    console.error(`Tipo de alerta desconocido: ${tipo}`);
    return null;
  }
  
  const Icon = config.icon;
  const utilidadSegura = isNaN(utilidad) ? 0 : utilidad;

  return (
    <Alert
      icon={<Icon style={{ width: 20, height: 20 }} />}
      title={config.title}
      color={config.color}
      radius="md"
      mb="xs"
    >
      <Text size="sm">
        <strong>Utilidad: {numberFormat.formatCurrency(utilidadSegura)}</strong> - {config.mensaje}
      </Text>
    </Alert>
  );
};
