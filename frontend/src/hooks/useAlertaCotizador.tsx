import { Alert, Text, Group } from '@mantine/core';
import { ShieldExclamationIcon, DocumentTextIcon, CheckBadgeIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import React from 'react';

interface AlertaProps {
  presupuestoId: number | null;
  clienteNombre: string;
  totalInsumos: number;
  totalPrestaciones: number;
  rentabilidad: number;
  financiadorId: string | null;
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
    financiadorId
  } = props;
  
  const alertas: React.ReactNode[] = [];

  // --- LÓGICA DE ALERTA 1: Faltan datos básicos para cotizar (Máxima Prioridad) ---
  if (!presupuestoId) {
    alertas.push(
      <Alert 
        key="no-presupuesto"
        icon={<DocumentTextIcon className="w-5 h-5" />} 
        title="¡Presupuesto No Creado!" 
        color="blue"
        radius="md"
        className="mb-3" // Añadimos un pequeño margen entre alertas
      >
        <Text size="sm">
          Crea un nuevo presupuesto o carga uno existente en la pestaña "Datos Paciente" para continuar cargando insumos y prestaciones.
        </Text>
      </Alert>
    );
    // Si no hay presupuesto, no tiene sentido mostrar las demás alertas.
    // Podrías retornar aquí si quieres que solo se muestre esta alerta.
    return <>{alertas}</>; 
  }

  // --- LÓGICA DE ALERTA 2: Rentabilidad Negativa (Alta Prioridad) ---
if (rentabilidad > 0 && rentabilidad < 30) {
  alertas.push(
    <Alert 
      key="rentabilidad-baja"
      icon={<ShieldExclamationIcon className="w-5 h-5" />} 
      title="¡ALERTA DE PÉRDIDA!" 
      color="red"
      radius="md"
      className="mb-3"
    >
      <Text size="sm">
        La rentabilidad actual es del **{rentabilidad.toFixed(2)}%**. El **Costo Total** supera al **Total a Facturar**. Ajusta los valores o revisa los precios.
      </Text>
    </Alert>
  );
} else if (rentabilidad >= 30 && rentabilidad < 70) {
  alertas.push(
    <Alert 
      key="rentabilidad-media"
      icon={<ExclamationTriangleIcon className="w-5 h-5" />} 
      title="OPORTUNIDAD DE MEJORA" 
      color="yellow"
      radius="md"
      className="mb-3"
    >
      <Text size="sm">
        La rentabilidad actual es del **{rentabilidad.toFixed(2)}%**. Puedes mejorar los valores para aumentar tu margen de ganancia.
      </Text>
    </Alert>
  );
} else if (rentabilidad >= 70) {
  alertas.push(
    <Alert 
      key="rentabilidad-alta"
      icon={<CheckCircleIcon className="w-5 h-5" />} 
      title="¡EXCELENTE RENTABILIDAD!" 
      color="green"
      radius="md"
      className="mb-3"
    >
      <Text size="sm">
        La rentabilidad actual es del **{rentabilidad.toFixed(2)}%**. ¡Sigue manteniendo estos excelentes resultados!
      </Text>
    </Alert>
  );
}
  
  // --- LÓGICA DE ALERTA 3: Cotización completa pero sin financiador (Prioridad Media) ---
  if (totalInsumos > 0 && totalPrestaciones > 0 && !financiadorId) {
    alertas.push(
      <Alert 
        key="falta-financiador"
        icon={<ShieldExclamationIcon className="w-5 h-5" />} 
        title="Advertencia: Falta Financiador" 
        color="yellow"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          El presupuesto contiene ítems, pero el **Financiador no está asignado**. Confirma el Financiador antes de guardar.
        </Text>
      </Alert>
    );
  }

  // --- LÓGICA DE ALERTA 4: Todo correcto (Confirmación, solo se muestra si NO hay alertas negativas) ---
  if (alertas.length === 0 && presupuestoId && (totalInsumos > 0 || totalPrestaciones > 0)) {
    alertas.push(
      <Alert 
        key="listo-para-guardar"
        icon={<CheckBadgeIcon className="w-5 h-5" />} 
        title="Cotización Lista para Guardar" 
        color="green"
        radius="md"
        className="mb-3"
      >
        <Text size="sm">
          Presupuesto para **{clienteNombre}** con rentabilidad positiva. Recuerda presionar **"Guardar"** para actualizar los totales.
        </Text>
      </Alert>
    );
  }

  // Si no se aplica ninguna alerta específica, devuelve null
  if (alertas.length === 0) {
    return null;
  }
  
  // Devuelve todas las alertas como un fragmento
  return <>{alertas}</>;
};
