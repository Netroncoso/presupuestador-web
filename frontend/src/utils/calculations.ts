import { FinanciadorInfo } from '../types';
import { TASA_DEFAULT, DIAS_DEFAULT } from './constants';

export const calcularCostoTotal = (totalInsumos: number, totalPrestaciones: number): number => {
  return totalInsumos + totalPrestaciones;
};

export const calcularTotalFacturar = (
  totalInsumos: number,
  totalFacturarPrestaciones: number,
  porcentajeInsumos: number
): number => {
  return totalInsumos * (1 + porcentajeInsumos / 100) + totalFacturarPrestaciones;
};

export const calcularRentabilidad = (costoTotal: number, totalFacturar: number): number => {
  return costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;
};

export const calcularMargen = (costoTotal: number, totalFacturar: number): number => {
  return totalFacturar > 0 ? (totalFacturar - costoTotal) / totalFacturar : 0;
};

export const calcularUtilidadConPlazo = (
  totalFacturar: number,
  costoTotal: number,
  financiadorInfo?: FinanciadorInfo
): number => {
  if (costoTotal === 0 || !financiadorInfo) return totalFacturar - costoTotal;

  const diasCobranza = financiadorInfo.dias_cobranza_real || financiadorInfo.dias_cobranza_teorico || DIAS_DEFAULT;
  const tasaMensual = (financiadorInfo.tasa_mensual || TASA_DEFAULT) / 100;
  const mesesCobranza = Math.floor(diasCobranza / 30);
  
  const valorPresente = totalFacturar / Math.pow(1 + tasaMensual, mesesCobranza);
  return valorPresente - costoTotal;
};

export const calcularRentabilidadConPlazo = (
  utilidadConPlazo: number,
  costoTotal: number
): number => {
  return costoTotal > 0 ? (utilidadConPlazo / costoTotal) * 100 : 0;
};
