import { FinanciadorInfo } from '../types';
import { api } from '../api/api';

// Cache de valores por defecto desde BD
let configCache: { tasa: number; dias: number } | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60000; // 1 minuto

// Cargar valores por defecto desde BD
const getDefaults = async (): Promise<{ tasa: number; dias: number }> => {
  const now = Date.now();
  if (configCache && now - cacheTime < CACHE_DURATION) {
    return configCache;
  }

  try {
    const { data } = await api.get('/configuracion?categoria=financiero');
    const tasa = data.find((c: any) => c.clave === 'financiero.tasaMensualDefault')?.valor || 2;
    const dias = data.find((c: any) => c.clave === 'financiero.diasCobranzaDefault')?.valor || 30;
    configCache = { tasa, dias };
    cacheTime = now;
    return configCache;
  } catch {
    return { tasa: 2, dias: 30 }; // Fallback
  }
};

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

export const calcularUtilidadConPlazo = async (
  totalFacturar: number,
  costoTotal: number,
  financiadorInfo?: FinanciadorInfo
): Promise<number> => {
  if (costoTotal === 0 || !financiadorInfo) return totalFacturar - costoTotal;

  const defaults = await getDefaults();
  const diasCobranza = financiadorInfo.dias_cobranza_real || financiadorInfo.dias_cobranza_teorico || defaults.dias;
  const tasaMensual = (financiadorInfo.tasa_mensual || defaults.tasa) / 100;
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
