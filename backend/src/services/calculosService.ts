import { BusinessRules } from '../config/businessRules';

interface RazonAuditoria {
  tipo: string;
  valor?: number;
  umbral?: number;
  mensaje: string;
  servicios?: string[];
  insumos?: string[];
}

interface EvaluacionAuditoria {
  estado: string;
  razones: RazonAuditoria[];
  totalViolaciones: number;
}

export class CalculosService {
  calcularRentabilidad(costoTotal: number, totalFacturar: number): number {
    if (costoTotal === 0) return 0;
    return ((totalFacturar - costoTotal) / costoTotal) * 100;
  }

  calcularRentabilidadConPlazo(
    totalFacturar: number,
    costoTotal: number,
    tasaMensual: number,
    diasCobranza: number
  ): number {
    if (costoTotal === 0 || isNaN(costoTotal) || isNaN(totalFacturar)) return 0;
    if (isNaN(tasaMensual) || isNaN(diasCobranza) || diasCobranza < 0) return this.calcularRentabilidad(costoTotal, totalFacturar);

    const mesesCobranza = Math.floor(diasCobranza / 30);
    const valorPresente = totalFacturar / Math.pow(1 + tasaMensual / 100, mesesCobranza);
    const utilidadConPlazo = valorPresente - costoTotal;
    return (utilidadConPlazo / costoTotal) * 100;
  }

  evaluarEstadoAutomatico(
    presupuesto: {
      rentabilidad: number;
      rentabilidad_con_plazo: number;
      costo_total: number;
      total_facturar: number;
      dificil_acceso: string;
    },
    tieneInsumosCriticos: boolean = false,
    tieneOrden5: boolean = false,
    serviciosOrden5: string[] = [],
    insumosCriticos: string[] = [],
    esAuditoriaManual: boolean = false,
    tieneFueraTarifario: boolean = false,
    serviciosFueraTarifario: string[] = [],
    tieneMarkupExcesivo: boolean = false,
    serviciosMarkupExcesivo: string[] = []
  ): EvaluacionAuditoria {
    const razones: RazonAuditoria[] = [];
    const { auditoria } = BusinessRules;

    // 1. Auditoría manual (siempre primera razón si aplica)
    if (esAuditoriaManual) {
      razones.push({
        tipo: 'auditoria_manual',
        mensaje: 'Auditoría solicitada manualmente por el usuario'
      });
    }

    // 2. Insumos críticos (prioridad máxima)
    if (tieneInsumosCriticos) {
      razones.push({
        tipo: 'insumos_criticos',
        insumos: insumosCriticos,
        mensaje: `Contiene insumos críticos: ${insumosCriticos.join(', ')}`
      });
    }

    // 3. Servicios orden 5 (NUEVO)
    if (tieneOrden5) {
      razones.push({
        tipo: 'orden_5',
        servicios: serviciosOrden5,
        mensaje: `Servicios con valor más alto: ${serviciosOrden5.join(', ')} → Requiere auditoría`
      });
    }

    // 4. Servicios fuera de tarifario (NUEVO)
    if (tieneFueraTarifario) {
      razones.push({
        tipo: 'fuera_tarifario',
        servicios: serviciosFueraTarifario,
        mensaje: `Servicios con costo editado manualmente: ${serviciosFueraTarifario.join(', ')}`
      });
    }

    // 5. Markup excesivo en servicios (NUEVO)
    if (tieneMarkupExcesivo) {
      razones.push({
        tipo: 'markup_excesivo',
        servicios: serviciosMarkupExcesivo,
        mensaje: `Servicios con markup excesivo: ${serviciosMarkupExcesivo.join(', ')}`
      });
    }

    // 6. Rentabilidad muy baja
    if (presupuesto.rentabilidad < auditoria.rentabilidadMinima) {
      razones.push({
        tipo: 'rentabilidad_baja',
        valor: presupuesto.rentabilidad,
        umbral: auditoria.rentabilidadMinima,
        mensaje: `Rentabilidad ${presupuesto.rentabilidad.toFixed(1)}% < ${auditoria.rentabilidadMinima}%`
      });
    }

    // 7. Rentabilidad muy alta (posible sobreprecio)
    if (presupuesto.rentabilidad > auditoria.rentabilidadMaxima) {
      razones.push({
        tipo: 'rentabilidad_alta',
        valor: presupuesto.rentabilidad,
        umbral: auditoria.rentabilidadMaxima,
        mensaje: `Rentabilidad ${presupuesto.rentabilidad.toFixed(1)}% > ${auditoria.rentabilidadMaxima}% (posible sobreprecio)`
      });
    }

    // 8. Costo total alto
    if (presupuesto.costo_total > auditoria.costoMaximo) {
      razones.push({
        tipo: 'costo_alto',
        valor: presupuesto.costo_total,
        umbral: auditoria.costoMaximo,
        mensaje: `Costo $${presupuesto.costo_total.toLocaleString('es-AR')} > $${auditoria.costoMaximo.toLocaleString('es-AR')}`
      });
    }

    const utilidad = presupuesto.total_facturar - presupuesto.costo_total;

    // 9. Utilidad muy baja
    if (utilidad < auditoria.utilidadMinimaBaja) {
      razones.push({
        tipo: 'utilidad_baja',
        valor: utilidad,
        umbral: auditoria.utilidadMinimaBaja,
        mensaje: `Utilidad $${utilidad.toLocaleString('es-AR')} < $${auditoria.utilidadMinimaBaja.toLocaleString('es-AR')}`
      });
    }

    // 10. Utilidad muy alta
    if (utilidad > auditoria.utilidadMinima) {
      razones.push({
        tipo: 'utilidad_alta',
        valor: utilidad,
        umbral: auditoria.utilidadMinima,
        mensaje: `Utilidad $${utilidad.toLocaleString('es-AR')} > $${auditoria.utilidadMinima.toLocaleString('es-AR')}`
      });
    }

    return {
      estado: razones.length > 0 ? 'pendiente_prestacional' : 'pendiente_carga',
      razones,
      totalViolaciones: razones.length
    };
  }
}
