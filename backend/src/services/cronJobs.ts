import { auditoriaMultiService } from './auditoriaMultiService';

/**
 * Cron Jobs del sistema
 */

// Auto-liberación de casos inactivos (cada 5 minutos)
export function iniciarCronJobs() {
  console.log('[Cron] Iniciando jobs...');
  
  // Ejecutar cada 5 minutos
  setInterval(() => {
    auditoriaMultiService.autoLiberarCasosInactivos();
  }, 5 * 60 * 1000);
  
  console.log('[Cron] Auto-liberación configurada (cada 5 min)');
}
