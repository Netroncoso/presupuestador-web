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

export const RentabilidadAlert = ({ tipo, rentabilidad, usandoPlazo }: Props) => {
  const config = CONFIG[tipo];
  const Icon = config.icon;
  const plazoText = usandoPlazo ? ' (Ajustada por plazo)' : '';

  return (
    <Alert
      icon={<Icon style={{ width: 20, height: 20 }} />}
      title={config.title}
      color={config.color}
      radius="md"
      mb="xs"
    >
      <Text size="sm">
        <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong>{plazoText} - {config.mensaje}
      </Text>
    </Alert>
  );
};
