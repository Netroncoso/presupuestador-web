/**
 * Configuración centralizada de reglas de negocio
 * Todos los valores hardcodeados deben estar aquí
 */

export const BusinessRules = {
  // Reglas de auditoría automática
  auditoria: {
    rentabilidadMinima: 15, // %
    costoMaximo: 150000, // $
    rentabilidadConPlazoMaxima: 25, // %
  },

  // Valores por defecto financieros
  financiero: {
    diasCobranzaDefault: 30, // días
    tasaMensualDefault: 2, // %
  },

  // Paginación
  paginacion: {
    limitDefault: 100,
    offsetDefault: 0,
  },

  // Estados válidos
  estados: {
    validos: ['pendiente', 'en_revision', 'aprobado', 'rechazado', 'borrador'],
    iniciales: ['borrador'],
    finales: ['aprobado', 'rechazado'],
    requierenNotificacion: ['aprobado', 'rechazado'],
  },

  // Versiones
  versionado: {
    versionInicial: 1,
  },
} as const;

/**
 * Helper para obtener días de cobranza con fallback
 */
export function getDiasCobranza(
  dias_cobranza_real?: number | null,
  dias_cobranza_teorico?: number | null
): number {
  return dias_cobranza_real || dias_cobranza_teorico || BusinessRules.financiero.diasCobranzaDefault;
}

/**
 * Helper para obtener tasa mensual con fallback
 */
export function getTasaMensual(tasa_mensual?: number | null): number {
  return tasa_mensual || BusinessRules.financiero.tasaMensualDefault;
}
