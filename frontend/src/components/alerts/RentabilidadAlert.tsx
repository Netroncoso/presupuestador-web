import { Alert, Text } from '@mantine/core';
import { ExclamationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { TipoAlertaRentabilidad } from '../../services/alertaService';

interface Props {
  tipo: TipoAlertaRentabilidad;
  rentabilidad: number;
  usandoPlazo: boolean;
}

const CONFIG = {
  DESAPROBADO: {
    icon: ExclamationCircleIcon,
    title: 'DESAPROBADO',
    color: 'red',
    mensaje: 'Este presupuesto no es viable. Revisa costos y valores asignados.',
  },
  MEJORAR: {
    icon: ExclamationTriangleIcon,
    title: 'MEJORAR VALORES',
    color: 'orange',
    mensaje: 'Rentabilidad baja. Considera renegociar valores o revisar costos.',
  },
  FELICITACIONES: {
    icon: CheckBadgeIcon,
    title: 'FELICITACIONES',
    color: 'green',
    mensaje: 'Excelente rentabilidad alcanzada. ¡Buen trabajo!',
  },
  EXCEPCIONAL: {
    icon: CheckBadgeIcon,
    title: 'RENTABILIDAD EXCEPCIONAL',
    color: 'violet',
    mensaje: '¡Resultado extraordinario! Márgenes óptimos.',
  },
} as const;

export const RentabilidadAlert = ({ tipo, rentabilidad }: Props) => {
  const config = CONFIG[tipo];
  
  if (!config) {
    console.error(`Tipo de alerta desconocido: ${tipo}`);
    return null;
  }
  
  const Icon = config.icon;
  const rentabilidadSegura = isNaN(rentabilidad) ? 0 : rentabilidad;

  return (
    <Alert
      icon={<Icon style={{ width: 20, height: 20 }} />}
      title={config.title}
      color={config.color}
      radius="md"
      mb="xs"
    >
      <Text size="sm">
        <strong>Rentabilidad: {rentabilidadSegura.toFixed(2)}%</strong> - {config.mensaje}
      </Text>
    </Alert>
  );
};
