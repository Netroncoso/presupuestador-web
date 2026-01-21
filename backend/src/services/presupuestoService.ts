import { PresupuestoRepository } from '../repositories/presupuestoRepository';
import { CalculosService } from './calculosService';
import { AppError } from '../middleware/errorHandler';
import { getDiasCobranza, getTasaMensual } from '../config/businessRules';

export class PresupuestoService {
  private repo: PresupuestoRepository;
  private calculos: CalculosService;

  constructor() {
    this.repo = new PresupuestoRepository();
    this.calculos = new CalculosService();
  }

  async finalizar(id: number) {
    console.log('[DEBUG] Iniciando finalización presupuesto:', id);
    const presupuesto = await this.repo.obtenerConTotales(id);
    console.log('[DEBUG] Presupuesto obtenido:', presupuesto ? 'OK' : 'NULL');

    if (!presupuesto) {
      throw new AppError(404, 'Presupuesto no encontrado');
    }

    if (presupuesto.estado !== 'borrador') {
      throw new AppError(400, 'Solo se pueden finalizar presupuestos en borrador');
    }

    const totalInsumos = Number(presupuesto.total_insumos_costo);
    const totalPrestaciones = Number(presupuesto.total_prestaciones_costo);
    const totalEquipamientos = Number(presupuesto.total_equipamientos_costo || 0);
    const costoTotal = totalInsumos + totalPrestaciones + totalEquipamientos;

    if (costoTotal === 0) {
      throw new AppError(400, 'No se puede finalizar un presupuesto sin insumos, prestaciones o equipamientos');
    }

    const totalFacturar = Number(presupuesto.total_insumos_facturar) + Number(presupuesto.total_prestaciones_facturar) + Number(presupuesto.total_equipamientos_facturar || 0);
    const rentabilidad = this.calculos.calcularRentabilidad(costoTotal, totalFacturar);

    let rentabilidadConPlazo = rentabilidad;

    if (presupuesto.financiador_id) {
      const diasCobranza = getDiasCobranza(presupuesto.dias_cobranza_real, presupuesto.dias_cobranza_teorico);
      const tasaMensual = getTasaMensual(presupuesto.tasa_mensual);
      
      rentabilidadConPlazo = this.calculos.calcularRentabilidadConPlazo(
        totalFacturar,
        costoTotal,
        tasaMensual,
        diasCobranza
      );
    }

    // Verificar insumos críticos
    console.log('[DEBUG] Verificando insumos críticos...');
    const tieneInsumosCriticos = await this.repo.tieneInsumosCriticos(id);
    console.log('[DEBUG] Tiene insumos críticos:', tieneInsumosCriticos);

    console.log('[DEBUG] Evaluando estado automático...');
    const estadoFinal = this.calculos.evaluarEstadoAutomatico({
      rentabilidad,
      rentabilidad_con_plazo: rentabilidadConPlazo,
      costo_total: costoTotal,
      total_facturar: totalFacturar,
      dificil_acceso: presupuesto.dificil_acceso
    }, tieneInsumosCriticos);
    console.log('[DEBUG] Estado final:', estadoFinal);

    console.log('[DEBUG] Actualizando totales...');
    await this.repo.actualizarTotales(id, {
      estado: estadoFinal,
      totalInsumos,
      totalPrestaciones,
      totalEquipamientos,
      costoTotal,
      totalFacturar,
      rentabilidad,
      rentabilidadConPlazo
    });
    console.log('[DEBUG] Totales actualizados');

    if (estadoFinal === 'pendiente_comercial') {
      await this.repo.crearRegistroAuditoriaInicial(
        id,
        presupuesto.version,
        presupuesto.usuario_id,
        'borrador',
        'pendiente_comercial',
        'Auditoría automática por reglas de negocio'
      ).catch(err => console.error('Error creando registro auditoría:', err));

      await this.repo.notificarAuditores(
        id,
        presupuesto.version,
        `Presupuesto finalizado requiere aprobación: ${presupuesto.Nombre_Apellido}`
      ).catch(err => console.error('Error notificando:', err));
    }

    if (estadoFinal === 'pendiente_carga') {
      await this.repo.notificarOperadoresCarga(
        id,
        presupuesto.version,
        presupuesto.Nombre_Apellido,
        totalFacturar
      ).catch(err => console.error('Error notificando operadores carga:', err));
      
      await this.repo.notificarUsuarioAprobacionAutomatica(
        presupuesto.usuario_id,
        id,
        presupuesto.version
      ).catch(err => console.error('Error notificando usuario:', err));
    }

    console.log('[DEBUG] Finalización completada, retornando resultado');
    return {
      estadoFinal,
      tieneInsumosCriticos,
      totales: {
        totalInsumos,
        totalPrestaciones,
        totalEquipamientos,
        costoTotal,
        totalFacturar,
        rentabilidad: Number(rentabilidad.toFixed(2)),
        rentabilidadConPlazo: Number(rentabilidadConPlazo.toFixed(2))
      }
    };
  }
}
