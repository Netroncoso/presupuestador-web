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
    try {
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

    // Verificar todas las condiciones de auditoría EN PARALELO
    const [insumosCriticos, serviciosOrden5, serviciosFueraTarifario, serviciosMarkupExcesivo] = await Promise.all([
      this.repo.obtenerInsumosCriticos(id),
      this.repo.obtenerServiciosOrden5(id),
      this.repo.obtenerServiciosFueraTarifario(id),
      this.repo.obtenerServiciosMarkupExcesivo(id)
    ]);

    const tieneInsumosCriticos = insumosCriticos.length > 0;
    const tieneOrden5 = serviciosOrden5.length > 0;
    const tieneFueraTarifario = serviciosFueraTarifario.length > 0;
    const tieneMarkupExcesivo = serviciosMarkupExcesivo.length > 0;

    const evaluacion = this.calculos.evaluarEstadoAutomatico({
      rentabilidad,
      rentabilidad_con_plazo: rentabilidadConPlazo,
      costo_total: costoTotal,
      total_facturar: totalFacturar,
      dificil_acceso: presupuesto.dificil_acceso
    }, tieneInsumosCriticos, tieneOrden5, serviciosOrden5, insumosCriticos, false, tieneFueraTarifario, serviciosFueraTarifario, tieneMarkupExcesivo, serviciosMarkupExcesivo);

    const estadoFinal = evaluacion.estado;

    // Crear objeto de razones para almacenar en JSON
    const razonesAuditoria = {
      razones: evaluacion.razones,
      evaluado_en: new Date().toISOString(),
      total_violaciones: evaluacion.totalViolaciones,
      tipo_evaluacion: 'automatica'
    };

    // Actualizar totales y razones EN PARALELO
    await Promise.all([
      this.repo.actualizarTotales(id, {
        estado: estadoFinal,
        totalInsumos: totalInsumosFacturar,
        totalPrestaciones: totalPrestacionesFacturar,
        totalEquipamientos: totalEquipamientosFacturar,
        costoTotal,
        totalFacturar,
        rentabilidad,
        rentabilidadConPlazo
      }),
      this.repo.actualizarRazonesAuditoria(id, razonesAuditoria, tieneOrden5, tieneInsumosCriticos)
    ]);

    // Notificaciones asíncronas (no bloquean respuesta)
    if (estadoFinal === 'pendiente_prestacional') {
      const razonesTexto = evaluacion.razones.map(r => r.mensaje).join(', ');
      Promise.all([
        this.repo.crearRegistroAuditoriaInicial(
          id,
          presupuesto.version,
          presupuesto.usuario_id,
          'borrador',
          'pendiente_prestacional',
          'Auditoría automática por reglas de negocio'
        ),
        this.repo.notificarAuditores(
          id,
          presupuesto.version,
          `Presupuesto requiere auditoría: ${presupuesto.Nombre_Apellido} (${evaluacion.totalViolaciones} violaciones: ${razonesTexto})`,
          'gerencia_prestacional'
        )
      ]).catch(err => console.error('Error en notificaciones:', err));
    }

    if (estadoFinal === 'pendiente_carga') {
      Promise.all([
        this.repo.notificarOperadoresCarga(
          id,
          presupuesto.version,
          presupuesto.Nombre_Apellido,
          totalFacturar
        ),
        this.repo.notificarUsuarioAprobacionAutomatica(
          presupuesto.usuario_id,
          id,
          presupuesto.version
        )
      ]).catch(err => console.error('Error en notificaciones:', err));
    }

    return {
      estadoFinal,
      tieneInsumosCriticos,
      tieneOrden5,
      razones: evaluacion.razones.map(r => r.mensaje), // Para compatibilidad con frontend
      razonesDetalladas: evaluacion.razones, // Nueva estructura completa
      totalViolaciones: evaluacion.totalViolaciones,
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
    } catch (error) {
      console.error('Error fatal en finalizar:', error);
      throw error;
    }
  }

  async solicitarAuditoriaManual(id: number, usuarioId: number) {
    const presupuesto = await this.repo.obtenerConTotales(id);

    if (!presupuesto) {
      throw new AppError(404, 'Presupuesto no encontrado');
    }

    if (presupuesto.estado !== 'borrador') {
      throw new AppError(400, 'Solo se puede solicitar auditoría de presupuestos en borrador');
    }

    // Calcular totales para contexto
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
      rentabilidadConPlazo = this.calculos.calcularRentabilidadConPlazo(totalFacturar, costoTotal, tasaMensual, diasCobranza);
    }

    // Verificar condiciones para contexto EN PARALELO
    const [insumosCriticos, serviciosOrden5, serviciosFueraTarifario, serviciosMarkupExcesivo] = await Promise.all([
      this.repo.obtenerInsumosCriticos(id),
      this.repo.obtenerServiciosOrden5(id),
      this.repo.obtenerServiciosFueraTarifario(id),
      this.repo.obtenerServiciosMarkupExcesivo(id)
    ]);

    const tieneInsumosCriticos = insumosCriticos.length > 0;
    const tieneOrden5 = serviciosOrden5.length > 0;
    const tieneFueraTarifario = serviciosFueraTarifario.length > 0;
    const tieneMarkupExcesivo = serviciosMarkupExcesivo.length > 0;

    // Evaluar reglas automáticas para contexto (con flag de auditoría manual)
    const evaluacion = this.calculos.evaluarEstadoAutomatico({
      rentabilidad,
      rentabilidad_con_plazo: rentabilidadConPlazo,
      costo_total: costoTotal,
      total_facturar: totalFacturar,
      dificil_acceso: presupuesto.dificil_acceso
    }, tieneInsumosCriticos, tieneOrden5, serviciosOrden5, insumosCriticos, true, tieneFueraTarifario, serviciosFueraTarifario, tieneMarkupExcesivo, serviciosMarkupExcesivo); // true = es auditoría manual

    // Crear objeto de razones
    const razonesAuditoria = {
      razones: evaluacion.razones,
      evaluado_en: new Date().toISOString(),
      total_violaciones: evaluacion.totalViolaciones,
      tipo_evaluacion: 'manual'
    };

    // Actualizar estado y razones
    await this.repo.actualizarTotales(id, {
      estado: 'pendiente_prestacional',
      totalInsumos: totalInsumosFacturar,
      totalPrestaciones: totalPrestacionesFacturar,
      totalEquipamientos: totalEquipamientosFacturar,
      costoTotal,
      totalFacturar,
      rentabilidad,
      rentabilidadConPlazo
    });

    await this.repo.actualizarRazonesAuditoria(id, razonesAuditoria, tieneOrden5, tieneInsumosCriticos);

    // Crear registro de auditoría
    await this.repo.crearRegistroAuditoriaInicial(
      id,
      presupuesto.version,
      usuarioId,
      'borrador',
      'pendiente_prestacional',
      'Auditoría solicitada manualmente por el usuario'
    );

    // Notificar auditores
    await this.repo.notificarAuditores(
      id,
      presupuesto.version,
      `Auditoría manual solicitada: ${presupuesto.Nombre_Apellido} (${evaluacion.totalViolaciones} condiciones detectadas)`,
      'gerencia_prestacional'
    );

    return {
      estadoFinal: 'pendiente_prestacional',
      razones: evaluacion.razones.map(r => r.mensaje),
      razonesDetalladas: evaluacion.razones,
      totalViolaciones: evaluacion.totalViolaciones,
      esAuditoriaManual: true
    };
  }
}
