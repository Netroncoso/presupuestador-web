import { FinanciadorInfo, Prestacion } from '../types';
import { ACUERDOS } from '../utils/constants';

export type TipoAlertaRentabilidad =
  | 'DESAPROBADO'
  | 'MEJORAR'
  | 'AUTORIZADO_MEJORA'
  | 'AUTORIZADO'
  | 'FELICITACIONES'
  | 'SUPER_RENTABLE'
  | 'EXCEPCIONAL';

export type TipoAlertaMonto = 'ELEVADO' | 'CRITICO' | null;

// Cache de configuración de alertas
let alertasConfigCache: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minuto

const getAlertasConfig = async () => {
  const now = Date.now();
  if (alertasConfigCache && (now - cacheTimestamp) < CACHE_TTL) {
    return alertasConfigCache;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/configuracion?categoria=alertas`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    
    // Verificar que data sea un array
    if (!Array.isArray(data)) {
      throw new Error('La respuesta no es un array');
    }
    
    // Convertir array a objeto para acceso rápido
    alertasConfigCache = data.reduce((acc: any, item: any) => {
      acc[item.clave] = item.valor;
      return acc;
    }, {});
    
    cacheTimestamp = now;
    return alertasConfigCache;
  } catch (error) {
    console.error('Error cargando configuración de alertas:', error);
    alertasConfigCache = null;
    cacheTimestamp = 0;
    // Valores por defecto si falla la carga
    return {
      'alerta.rentabilidad.desaprobado': 10,
      'alerta.rentabilidad.mejorar': 15,
      'alerta.rentabilidad.autorizado': 20,
      'alerta.rentabilidad.felicitaciones': 25,
      'alerta.rentabilidad.superRentable': 30,
      'alerta.rentabilidad.excepcional': 35,
      'alerta.monto.elevado': 100000,
      'alerta.monto.critico': 150000,
      'alerta.financiador.cobranzaLenta': 45,
      'alerta.financiador.cobranzaExtendida': 60,
      'alerta.financiador.tasaAlta': 5
    };
  }
};

export const evaluarRentabilidad = async (
  rentabilidad: number
): Promise<TipoAlertaRentabilidad | null> => {
  if (rentabilidad === 0) return null;

  const config = await getAlertasConfig();

  if (rentabilidad < config['alerta.rentabilidad.desaprobado']) return 'DESAPROBADO';
  if (rentabilidad < config['alerta.rentabilidad.mejorar']) return 'MEJORAR';
  if (rentabilidad < config['alerta.rentabilidad.autorizado']) return 'AUTORIZADO_MEJORA';
  if (rentabilidad < config['alerta.rentabilidad.felicitaciones']) return 'AUTORIZADO';
  if (rentabilidad < config['alerta.rentabilidad.superRentable']) return 'FELICITACIONES';
  if (rentabilidad < config['alerta.rentabilidad.excepcional']) return 'SUPER_RENTABLE';
  
  return 'EXCEPCIONAL';
};

export const evaluarMonto = async (totalFacturar: number): Promise<TipoAlertaMonto> => {
  const config = await getAlertasConfig();
  
  if (totalFacturar >= config['alerta.monto.critico']) return 'CRITICO';
  if (totalFacturar >= config['alerta.monto.elevado']) return 'ELEVADO';
  return null;
};

export const evaluarPrestacionesExcedidas = (prestaciones: Prestacion[], alertasConfig: any[]) => {
  return prestaciones.filter(p => {
    const alertaConfig = alertasConfig.find(a => a.tipo_unidad === p.tipo_unidad && a.activo === 1);
    if (!alertaConfig) return false;
    return p.cantidad > alertaConfig.cantidad_maxima;
  }).map(p => {
    const alertaConfig = alertasConfig.find(a => a.tipo_unidad === p.tipo_unidad);
    return {
      ...p,
      mensaje_alerta: alertaConfig?.mensaje_alerta,
      color_alerta: alertaConfig?.color_alerta
    };
  });
};

export const evaluarFinanciador = async (financiadorInfo?: FinanciadorInfo) => {
  if (!financiadorInfo) return null;

  const config = await getAlertasConfig();

  return {
    requiereAutorizacion: financiadorInfo.acuerdo_nombre === ACUERDOS.SIN_CONVENIO,
    cobranzaExtendida: financiadorInfo.dias_cobranza_real && financiadorInfo.dias_cobranza_real > config['alerta.financiador.cobranzaExtendida'],
    cobranzaLenta: financiadorInfo.dias_cobranza_real && financiadorInfo.dias_cobranza_real > config['alerta.financiador.cobranzaLenta'],
    tasaAlta: financiadorInfo.tasa_mensual && financiadorInfo.tasa_mensual > config['alerta.financiador.tasaAlta'],
    convenioFirmado: financiadorInfo.acuerdo_nombre === ACUERDOS.CON_CONVENIO,
    diasCobranza: financiadorInfo.dias_cobranza_real,
    tasaMensual: financiadorInfo.tasa_mensual,
  };
};
