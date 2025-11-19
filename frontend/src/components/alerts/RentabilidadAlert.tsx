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
    title: 'MEJORAR VALORES, PEDIR AUTORIZACIÓN',
    color: 'orange',
    mensaje: 'Se requiere autorización para proceder con esta rentabilidad.',
  },
  AUTORIZADO_MEJORA: {
    icon: CheckCircleIcon,
    title: 'AUTORIZADO, EN BÚSQUEDA DE MEJORA',
    color: 'yellow',
    mensaje: 'Presupuesto autorizado. Considera optimizar valores.',
  },
  AUTORIZADO: {
    icon: CheckCircleIcon,
    title: 'AUTORIZADO',
    color: 'blue',
    mensaje: 'Presupuesto dentro de parámetros aceptables.',
  },
  FELICITACIONES: {
    icon: CheckBadgeIcon,
    title: 'AUTORIZADO FELICITACIONES',
    color: 'green',
    mensaje: 'Excelente rentabilidad alcanzada.',
  },
  SUPER_RENTABLE: {
    icon: CheckBadgeIcon,
    title: 'AUTORIZADO, PACIENTE SUPER RENTABLE!! FELICITACIONES',
    color: 'teal',
    mensaje: 'Resultado excepcional. ¡Felicitaciones!',
  },
  EXCEPCIONAL: {
    icon: CheckBadgeIcon,
    title: 'RENTABILIDAD EXCEPCIONAL',
    color: 'violet',
    mensaje: '¡Resultado extraordinario! Caso de estudio.',
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
