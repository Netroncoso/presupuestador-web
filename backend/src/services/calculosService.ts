import { BusinessRules } from '../config/businessRules';

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
    tieneInsumosCriticos: boolean = false
  ): { estado: string; razones: string[] } {
    if (tieneInsumosCriticos) {
      return { estado: 'pendiente_prestacional', razones: ['Contiene insumos críticos'] };
    }

    const razones: string[] = [];
    const { auditoria } = BusinessRules;

    if (presupuesto.rentabilidad < auditoria.rentabilidadMinima) {
      razones.push(`Rentabilidad ${presupuesto.rentabilidad.toFixed(1)}% < ${auditoria.rentabilidadMinima}%`);
    }

    if (presupuesto.rentabilidad > auditoria.rentabilidadMaxima) {
      razones.push(`Rentabilidad ${presupuesto.rentabilidad.toFixed(1)}% > ${auditoria.rentabilidadMaxima}%`);
    }

    if (presupuesto.costo_total > auditoria.costoMaximo) {
      razones.push(`Costo $${presupuesto.costo_total.toLocaleString()} > $${auditoria.costoMaximo.toLocaleString()}`);
    }

    const utilidad = presupuesto.total_facturar - presupuesto.costo_total;

    if (utilidad < auditoria.utilidadMinimaBaja) {
      razones.push(`Utilidad $${utilidad.toLocaleString()} < $${auditoria.utilidadMinimaBaja.toLocaleString()}`);
    }

    if (utilidad > auditoria.utilidadMinima) {
      razones.push(`Utilidad $${utilidad.toLocaleString()} > $${auditoria.utilidadMinima.toLocaleString()}`);
    }

    return {
      estado: razones.length > 0 ? 'pendiente_prestacional' : 'pendiente_carga',
      razones
    };
  }
}
