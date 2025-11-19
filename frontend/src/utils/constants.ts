// Tasas y plazos por defecto
export const TASA_DEFAULT = 2;
export const DIAS_DEFAULT = 30;

// Umbrales de rentabilidad
export const RENTABILIDAD_THRESHOLDS = {
  DESAPROBADO: 0,
  MEJORAR: 10,
  AUTORIZADO_MEJORA: 35,
  AUTORIZADO: 40,
  FELICITACIONES: 50,
  SUPER_RENTABLE: 60,
  EXCEPCIONAL: 70,
} as const;

// Umbrales de monto a facturar
export const MONTO_THRESHOLDS = {
  ELEVADO: 1000000,
  CRITICO: 5000000,
} as const;

// Umbrales de días de cobranza
export const DIAS_COBRANZA_THRESHOLDS = {
  LENTO: 40,
  EXTENDIDO: 60,
} as const;

// Tasa mensual considerada alta
export const TASA_MENSUAL_ALTA = 0.08;

// Acuerdos especiales
export const ACUERDOS = {
  SIN_CONVENIO: "Sin convenio Firmado, Autoriza Valores Gerencia Comercial",
  CON_CONVENIO: "Con convenio firmado",
} as const;
