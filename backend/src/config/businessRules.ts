import { pool } from '../db';

/**
 * Configuración centralizada de reglas de negocio
 * Valores por defecto (fallback si no hay BD)
 */
const DEFAULT_RULES = {
  auditoria: {
    rentabilidadMinima: 15,
    costoMaximo: 150000,
    rentabilidadConPlazoMaxima: 25,
    utilidadMinima: 50000,
  },
  financiero: {
    diasCobranzaDefault: 30,
    tasaMensualDefault: 2,
  },
  paginacion: {
    limitDefault: 100,
    offsetDefault: 0,
  },
  estados: {
    validos: [
      'borrador',
      'pendiente_administrativa',
      'en_revision_administrativa',
      'pendiente_prestacional',
      'en_revision_prestacional',
      'pendiente_general',
      'en_revision_general',
      'aprobado',
      'aprobado_condicional',
      'pendiente_carga',        // NUEVO
      'en_carga',              // NUEVO
      'cargado',               // NUEVO
      'rechazado'
    ],
    iniciales: ['borrador'],
    finales: ['aprobado', 'aprobado_condicional', 'cargado', 'rechazado'],
    requierenNotificacion: ['aprobado', 'aprobado_condicional', 'cargado', 'rechazado'],
  },
  versionado: {
    versionInicial: 1,
  },
};

let cachedRules = { ...DEFAULT_RULES };
let lastFetch = 0;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Carga reglas desde BD con cache
 */
async function loadRulesFromDB() {
  try {
    const [rows] = await pool.query<any[]>('SELECT clave, valor FROM configuracion_sistema');
    
    if (!rows || !Array.isArray(rows)) {
      console.warn('No se encontraron reglas en BD, usando valores por defecto');
      return;
    }
    
    rows.forEach(row => {
      const [categoria, campo] = row.clave.split('.');
      if (cachedRules[categoria as keyof typeof cachedRules] && 
          typeof cachedRules[categoria as keyof typeof cachedRules] === 'object') {
        (cachedRules[categoria as keyof typeof cachedRules] as any)[campo] = Number(row.valor);
      }
    });
    
    lastFetch = Date.now();
  } catch (error) {
    console.error('Error cargando reglas desde BD, usando valores por defecto:', error instanceof Error ? error.message : 'Error desconocido');
  }
}

/**
 * Obtiene reglas actualizadas (con cache)
 */
export async function getBusinessRules() {
  if (Date.now() - lastFetch > CACHE_TTL) {
    try {
      await loadRulesFromDB();
    } catch (error) {
      console.error('Error actualizando reglas, usando cache:', error instanceof Error ? error.message : 'Error desconocido');
    }
  }
  return cachedRules;
}

/**
 * Reglas síncronas (para compatibilidad)
 */
export const BusinessRules = new Proxy(DEFAULT_RULES, {
  get(target, prop) {
    return cachedRules[prop as keyof typeof cachedRules] || target[prop as keyof typeof target];
  }
});

/**
 * Helper para obtener días de cobranza con fallback
 */
export function getDiasCobranza(
  dias_cobranza_real?: number | null,
  dias_cobranza_teorico?: number | null
): number {
  return dias_cobranza_real || dias_cobranza_teorico || cachedRules.financiero.diasCobranzaDefault;
}

/**
 * Helper para obtener tasa mensual con fallback
 */
export function getTasaMensual(tasa_mensual?: number | null): number {
  return tasa_mensual || cachedRules.financiero.tasaMensualDefault;
}

// Cargar reglas al iniciar
loadRulesFromDB().catch(err => {
  console.error('Error crítico al cargar reglas de negocio:', err instanceof Error ? err.message : 'Error desconocido');
});
