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

    const totalInsumosCosto = Number(presupuesto.total_insumos_costo);
    const totalPrestacionesCosto = Number(presupuesto.total_prestaciones_costo);
    const totalEquipamientosCosto = Number(presupuesto.total_equipamientos_costo || 0);
    const totalInsumosFacturar = Number(presupuesto.total_insumos_facturar);
    const totalPrestacionesFacturar = Number(presupuesto.total_prestaciones_facturar);
    const totalEquipamientosFacturar = Number(presupuesto.total_equipamientos_facturar || 0);
    const costoTotal = totalInsumosCosto + totalPrestacionesCosto + totalEquipamientosCosto;

    const totalFacturar = totalInsumosFacturar + totalPrestacionesFacturar + totalEquipamientosFacturar;
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

    const tieneInsumosCriticos = await this.repo.tieneInsumosCriticos(id);

    const evaluacion = this.calculos.evaluarEstadoAutomatico({
      rentabilidad,
      rentabilidad_con_plazo: rentabilidadConPlazo,
      costo_total: costoTotal,
      total_facturar: totalFacturar,
      dificil_acceso: presupuesto.dificil_acceso
    }, tieneInsumosCriticos);

    const estadoFinal = evaluacion.estado;

    await this.repo.actualizarTotales(id, {
      estado: estadoFinal,
      totalInsumos: totalInsumosFacturar,
      totalPrestaciones: totalPrestacionesFacturar,
      totalEquipamientos: totalEquipamientosFacturar,
      costoTotal,
      totalFacturar,
      rentabilidad,
      rentabilidadConPlazo
    });

    if (estadoFinal === 'pendiente_prestacional') {
      await this.repo.crearRegistroAuditoriaInicial(
        id,
        presupuesto.version,
        presupuesto.usuario_id,
        'borrador',
        'pendiente_prestacional',
        'Auditoría automática por reglas de negocio'
      ).catch(err => console.error('Error creando registro auditoría:', err));

      await this.repo.notificarAuditores(
        id,
        presupuesto.version,
        `Presupuesto finalizado requiere aprobación: ${presupuesto.Nombre_Apellido}`,
        'gerencia_prestacional'
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

    return {
      estadoFinal,
      tieneInsumosCriticos,
      razones: evaluacion.razones,
      totales: {
        totalInsumos: totalInsumosFacturar,
        totalPrestaciones: totalPrestacionesFacturar,
        totalEquipamientos: totalEquipamientosFacturar,
        costoTotal,
        totalFacturar,
        rentabilidad: Number(rentabilidad.toFixed(2)),
        rentabilidadConPlazo: Number(rentabilidadConPlazo.toFixed(2))
      }
    };
  }
}
