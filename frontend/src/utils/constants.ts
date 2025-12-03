// Acuerdos especiales (usado en lógica de negocio)
export const ACUERDOS = {
  SIN_CONVENIO: "Sin convenio Firmado, Autoriza Valores Gerencia Comercial",
  CON_CONVENIO: "Con convenio firmado",
} as const;

// NOTA: Los umbrales de alertas ahora se configuran desde la BD
// Ver tabla: configuracion_sistema (categoria='alertas')
// Gestión: Panel Admin > Reglas de Negocio > Alertas
