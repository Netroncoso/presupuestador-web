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
    const presupuesto = await this.repo.obtenerConTotales(id);

    if (!presupuesto) {
      throw new AppError(404, 'Presupuesto no encontrado');
    }

    if (presupuesto.estado !== 'borrador') {
      throw new AppError(400, 'Solo se pueden finalizar presupuestos en borrador');
    }

    const totalInsumos = Number(presupuesto.total_insumos_costo);
    const totalPrestaciones = Number(presupuesto.total_prestaciones_costo);
    const costoTotal = totalInsumos + totalPrestaciones;

    if (costoTotal === 0) {
      throw new AppError(400, 'No se puede finalizar un presupuesto sin insumos ni prestaciones');
    }

    const totalFacturar = Number(presupuesto.total_insumos_facturar) + Number(presupuesto.total_prestaciones_facturar);
    const rentabilidad = this.calculos.calcularRentabilidad(costoTotal, totalFacturar);

    let rentabilidadConPlazo = rentabilidad;

    if (presupuesto.idobra_social) {
      const diasCobranza = getDiasCobranza(presupuesto.dias_cobranza_real, presupuesto.dias_cobranza_teorico);
      const tasaMensual = getTasaMensual(presupuesto.tasa_mensual);
      
      rentabilidadConPlazo = this.calculos.calcularRentabilidadConPlazo(
        totalFacturar,
        costoTotal,
        tasaMensual,
        diasCobranza
      );
    }

    const estadoFinal = this.calculos.evaluarEstadoAutomatico({
      rentabilidad,
      rentabilidad_con_plazo: rentabilidadConPlazo,
      costo_total: costoTotal,
      dificil_acceso: presupuesto.dificil_acceso
    });

    await this.repo.actualizarTotales(id, {
      estado: estadoFinal,
      totalInsumos,
      totalPrestaciones,
      costoTotal,
      totalFacturar,
      rentabilidad,
      rentabilidadConPlazo
    });

    if (estadoFinal === 'pendiente') {
      await this.repo.notificarAuditores(
        id,
        presupuesto.version,
        `Presupuesto finalizado requiere aprobación: ${presupuesto.Nombre_Apellido}`
      ).catch(err => console.error('Error notificando:', err));
    }

    return {
      estadoFinal,
      totales: {
        totalInsumos,
        totalPrestaciones,
        costoTotal,
        totalFacturar,
        rentabilidad: Number(rentabilidad.toFixed(2)),
        rentabilidadConPlazo: Number(rentabilidadConPlazo.toFixed(2))
      }
    };
  }
}
