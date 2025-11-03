import { Alert, Text, Group } from '@mantine/core';
import { ShieldExclamationIcon, DocumentTextIcon, CheckBadgeIcon, ExclamationTriangleIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import React from 'react';

// Interface para la información del financiador
interface FinanciadorInfo {
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  acuerdo_nombre?: string | null;
  Financiador?: string;
  idobra_social?: string;
}

interface AlertaProps {
  presupuestoId: number | null;
  clienteNombre: string;
  totalInsumos: number;
  totalPrestaciones: number;
  rentabilidad: number;
  financiadorId: string | null;
  financiadorInfo?: FinanciadorInfo;
}

/**
 * Hook personalizado para generar componentes de alerta basados en el estado del presupuesto.
 * Retorna un fragmento de React que contiene CERO o MÚLTIPLES alertas.
 * @param props Datos de estado del UserDashboard (totales, ID, rentabilidad).
 * @returns Un React.Fragment con todas las alertas aplicables.
 */
export const useAlertaCotizador = (props: AlertaProps): React.ReactNode => {
  const { 
    presupuestoId, 
    clienteNombre, 
    totalInsumos, 
    totalPrestaciones, 
    rentabilidad,
    financiadorId,
    financiadorInfo
  } = props;
  
  const alertas: React.ReactNode[] = [];

  // Calcular total a facturar
  const totalFacturar = (totalInsumos + totalPrestaciones) * 1.7;

  // --- LÓGICA DE ALERTA 1: Faltan datos básicos para cotizar (Máxima Prioridad) ---
  if (!presupuestoId) {
    alertas.push(
      <Alert 
        key="no-presupuesto"
        icon={<DocumentTextIcon className="w-5 h-5" />} 
        title="¡Presupuesto No Creado!" 
        color="blue"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          Crea un nuevo presupuesto o carga uno existente en la pestaña "Datos Paciente" para continuar cargando insumos y prestaciones.
        </Text>
      </Alert>
    );
    return <>{alertas}</>; 
  }

  // --- LÓGICA DE ALERTA 2: Alertas por RANGO DE RENTABILIDAD ---
  if (rentabilidad < 0) {
    alertas.push(
      <Alert 
        key="rentabilidad-desaprobada"
        icon={<ExclamationCircleIcon className="w-5 h-5" />} 
        title="DESAPROBADO" 
        color="red"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong> - Este presupuesto no es viable. Revisa costos y valores asignados.
        </Text>
      </Alert>
    );
  } else if (rentabilidad >= 0 && rentabilidad < 35) {
    alertas.push(
      <Alert 
        key="rentabilidad-mejorar"
        icon={<ExclamationTriangleIcon className="w-5 h-5" />} 
        title="MEJORAR VALORES, PEDIR AUTORIZACIÓN" 
        color="orange"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong> - Se requiere autorización para proceder con esta rentabilidad.
        </Text>
      </Alert>
    );
  } else if (rentabilidad >= 35 && rentabilidad < 40) {
    alertas.push(
      <Alert 
        key="rentabilidad-autorizado-mejora"
        icon={<CheckCircleIcon className="w-5 h-5" />} 
        title="AUTORIZADO, EN BÚSQUEDA DE MEJORA" 
        color="yellow"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong> - Presupuesto autorizado. Considera optimizar valores.
        </Text>
      </Alert>
    );
  } else if (rentabilidad >= 40 && rentabilidad < 50) {
    alertas.push(
      <Alert 
        key="rentabilidad-autorizado"
        icon={<CheckCircleIcon className="w-5 h-5" />} 
        title="AUTORIZADO" 
        color="blue"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong> - Presupuesto dentro de parámetros aceptables.
        </Text>
      </Alert>
    );
  } else if (rentabilidad >= 50 && rentabilidad < 60) {
    alertas.push(
      <Alert 
        key="rentabilidad-autorizado-felicitaciones"
        icon={<CheckBadgeIcon className="w-5 h-5" />} 
        title="AUTORIZADO FELICITACIONES" 
        color="green"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong> - Excelente rentabilidad alcanzada.
        </Text>
      </Alert>
    );
  } else if (rentabilidad >= 60 && rentabilidad < 70) {
    alertas.push(
      <Alert 
        key="rentabilidad-super-rentable"
        icon={<CheckBadgeIcon className="w-5 h-5" />} 
        title="AUTORIZADO, PACIENTE SUPER RENTABLE!! FELICITACIONES" 
        color="teal"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong> - Resultado excepcional. ¡Felicitaciones!
        </Text>
      </Alert>
    );
  } else if (rentabilidad >= 70) {
    alertas.push(
      <Alert 
        key="rentabilidad-excepcional"
        icon={<CheckBadgeIcon className="w-5 h-5" />} 
        title="RENTABILIDAD EXCEPCIONAL" 
        color="violet"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Rentabilidad: {rentabilidad.toFixed(2)}%</strong> - ¡Resultado extraordinario! Caso de estudio.
        </Text>
      </Alert>
    );
  }

  // --- LÓGICA DE ALERTA 3: Alertas por MONTO A FACTURAR ---
  if (totalFacturar >= 1000000 && totalFacturar < 5000000) {
    alertas.push(
      <Alert 
        key="monto-alto"
        icon={<ShieldExclamationIcon className="w-5 h-5" />} 
        title="MONTO ELEVADO - DAR AVISO" 
        color="orange"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Monto a facturar: ${totalFacturar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> - 
          Se requiere revisión y aviso a las áreas correspondientes.
        </Text>
      </Alert>
    );
  } else if (totalFacturar >= 5000000) {
    alertas.push(
      <Alert 
        key="monto-muy-alto"
        icon={<ShieldExclamationIcon className="w-5 h-5" />} 
        title="MONTO CRÍTICO - SOLICITAR GESTIÓN" 
        color="red"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          <strong>Monto a facturar: ${totalFacturar.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> - 
          Se requiere gestión especial desde las áreas superiores.
        </Text>
      </Alert>
    );
  }


  // --- LÓGICA DE ALERTA 5: Alertas específicas del financiador ---
  if (financiadorInfo && financiadorId) {
    // Alerta para acuerdos que requieren atención especial
    if (financiadorInfo.acuerdo_nombre === "Sin convenio Firmado, Autoriza Valores Gerencia Comercial") {
      alertas.push(
        <Alert 
          key="acuerdo-gerencia"
          icon={<ExclamationTriangleIcon className="w-5 h-5" />} 
          title="Atención: Acuerdo Especial" 
          color="orange"
          radius="md"
          className="mb-3"
        >
          <Text size="sm">
            Este financiador <strong>requiere autorización de Gerencia Comercial</strong>. 
            Asegúrate de tener la aprobación correspondiente antes de proceder.
          </Text>
        </Alert>
      );
    }

    // Alerta para días de cobranza muy altos
    if (financiadorInfo.dias_cobranza_real && financiadorInfo.dias_cobranza_real > 40) {
      alertas.push(
        <Alert 
          key="cobranza-lenta"
          icon={<ShieldExclamationIcon className="w-5 h-5" />} 
          title="Cobranza Lenta" 
          color="yellow"
          radius="md"
          className="mb-3"
        >
          <Text size="sm">
            Este financiador tiene <strong>{financiadorInfo.dias_cobranza_real} días de cobranza real</strong>. 
            Considera este plazo en tu flujo de caja.
          </Text>
        </Alert>
      );
    }

    // Alerta para tasa mensual muy alta
    if (financiadorInfo.tasa_mensual && financiadorInfo.tasa_mensual > 0.08) {
      alertas.push(
        <Alert 
          key="tasa-alta"
          icon={<ExclamationTriangleIcon className="w-5 h-5" />} 
          title="Tasa Mensual Elevada" 
          color="orange"
          radius="md"
          className="mb-3"
        >
          <Text size="sm">
            Tasa mensual del <strong>{(financiadorInfo.tasa_mensual * 100).toFixed(2)}%</strong>. 
            Verifica que los precios cubran este costo adicional.
          </Text>
        </Alert>
      );
    }

    // Alerta positiva para convenios firmados
    if (financiadorInfo.acuerdo_nombre === "Con convenio firmado") {
      alertas.push(
        <Alert 
          key="convenio-firmado"
          icon={<CheckCircleIcon className="w-5 h-5" />} 
          title="Convenio Activo" 
          color="green"
          radius="md"
          className="mb-3"
        >
          <Text size="sm">
            <strong>Convenio firmado activo</strong>. Puedes proceder con la cotización según los términos establecidos.
          </Text>
        </Alert>
      );
    }
  }

  // Eliminamos la alerta "Todo correcto" ya que ahora tenemos alertas específicas para cada estado

  if (alertas.length === 0) {
    return null;
  }
  
  return <>{alertas}</>;
};