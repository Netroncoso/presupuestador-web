import { Alert, Text } from '@mantine/core';
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';

interface Props {
  requiereAutorizacion?: boolean;
  cobranzaExtendida?: boolean;
  cobranzaLenta?: boolean;
  tasaAlta?: boolean;
  convenioFirmado?: boolean;
  diasCobranza?: number;
  tasaMensual?: number;
}

export const FinanciadorAlerts = ({
  requiereAutorizacion,
  cobranzaExtendida,
  cobranzaLenta,
  tasaAlta,
  convenioFirmado,
  diasCobranza,
  tasaMensual,
}: Props) => {
  return (
    <>
      {(!diasCobranza || diasCobranza === 0) && (
        <Alert
          icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />}
          title="Datos Incompletos del Financiador"
          color="red"
          radius="md"
          mb="xs"
        >
          <Text size="sm">
            Este financiador <strong>no tiene configurados los días de cobranza</strong>. 
            Contacta al administrador para completar esta información crítica.
          </Text>
        </Alert>
      )}

      {requiereAutorizacion && (
        <Alert
          icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />}
          title="Atención: Acuerdo Especial"
          color="orange"
          radius="md"
          mb="xs"
        >
          <Text size="sm">
            Este financiador <strong>requiere autorización de Gerencia Comercial</strong>. 
            Asegúrate de tener la aprobación correspondiente antes de proceder.
          </Text>
        </Alert>
      )}

      {cobranzaExtendida && diasCobranza && (
        <Alert
          icon={<ClockIcon style={{ width: 20, height: 20 }} />}
          title="PLAZO DE COBRO EXTENDIDO"
          color="yellow"
          radius="md"
          mb="xs"
        >
          <Text size="sm">
            <strong>{diasCobranza} días de cobranza</strong> - 
            Considera el impacto significativo en el flujo de caja.
          </Text>
        </Alert>
      )}

      {cobranzaLenta && !cobranzaExtendida && diasCobranza && (
        <Alert
          icon={<ShieldExclamationIcon style={{ width: 20, height: 20 }} />}
          title="Cobranza Lenta"
          color="yellow"
          radius="md"
          mb="xs"
        >
          <Text size="sm">
            Este financiador tiene <strong>{diasCobranza} días de cobranza real</strong>. 
            Considera este plazo en tu flujo de caja.
          </Text>
        </Alert>
      )}

      {tasaAlta && tasaMensual && (
        <Alert
          icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />}
          title="Tasa Mensual Elevada"
          color="orange"
          radius="md"
          mb="xs"
        >
          <Text size="sm">
            Tasa mensual del <strong>{tasaMensual}%</strong>. 
            Verifica que los precios cubran este costo adicional.
          </Text>
        </Alert>
      )}

      {convenioFirmado && (
        <Alert
          icon={<CheckCircleIcon style={{ width: 20, height: 20 }} />}
          title="Convenio Activo"
          color="green"
          radius="md"
          mb="xs"
        >
          <Text size="sm">
            <strong>Convenio firmado activo</strong>. Puedes proceder con la cotización según los términos establecidos.
          </Text>
        </Alert>
      )}
    </>
  );
};
