import { FinanciadorInfo, Prestacion } from '../types';
import {
  RENTABILIDAD_THRESHOLDS,
  MONTO_THRESHOLDS,
  DIAS_COBRANZA_THRESHOLDS,
  TASA_MENSUAL_ALTA,
  ACUERDOS,
} from '../utils/constants';

export type TipoAlertaRentabilidad =
  | 'DESAPROBADO'
  | 'MEJORAR'
  | 'AUTORIZADO_MEJORA'
  | 'AUTORIZADO'
  | 'FELICITACIONES'
  | 'SUPER_RENTABLE'
  | 'EXCEPCIONAL';

export type TipoAlertaMonto = 'ELEVADO' | 'CRITICO' | null;

export const evaluarRentabilidad = (
  rentabilidad: number
): TipoAlertaRentabilidad | null => {

  if (rentabilidad === 0) return null; // 👈 NO DISPARAR ALERTA

  if (rentabilidad < RENTABILIDAD_THRESHOLDS.DESAPROBADO) return 'DESAPROBADO';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.MEJORAR) return 'MEJORAR';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.AUTORIZADO_MEJORA) return 'AUTORIZADO_MEJORA';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.AUTORIZADO) return 'AUTORIZADO';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.FELICITACIONES) return 'FELICITACIONES';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.SUPER_RENTABLE) return 'SUPER_RENTABLE';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.EXCEPCIONAL) return 'EXCEPCIONAL';

  return 'EXCEPCIONAL';
};



export const evaluarMonto = (totalFacturar: number): TipoAlertaMonto => {
  if (totalFacturar >= MONTO_THRESHOLDS.CRITICO) return 'CRITICO';
  if (totalFacturar >= MONTO_THRESHOLDS.ELEVADO) return 'ELEVADO';
  return null;
};

export const evaluarPrestacionesExcedidas = (prestaciones: Prestacion[]) => {
  return prestaciones.filter(p => p.cant_total && p.cantidad > p.cant_total);
};

export const evaluarFinanciador = (financiadorInfo?: FinanciadorInfo) => {
  if (!financiadorInfo) return null;

  return {
    requiereAutorizacion: financiadorInfo.acuerdo_nombre === ACUERDOS.SIN_CONVENIO,
    cobranzaExtendida: financiadorInfo.dias_cobranza_real && financiadorInfo.dias_cobranza_real > DIAS_COBRANZA_THRESHOLDS.EXTENDIDO,
    cobranzaLenta: financiadorInfo.dias_cobranza_real && financiadorInfo.dias_cobranza_real > DIAS_COBRANZA_THRESHOLDS.LENTO,
    tasaAlta: financiadorInfo.tasa_mensual && financiadorInfo.tasa_mensual > TASA_MENSUAL_ALTA,
    convenioFirmado: financiadorInfo.acuerdo_nombre === ACUERDOS.CON_CONVENIO,
    diasCobranza: financiadorInfo.dias_cobranza_real,
    tasaMensual: financiadorInfo.tasa_mensual,
  };
};
