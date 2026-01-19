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

  evaluarEstadoAutomatico(presupuesto: {
    rentabilidad: number;
    rentabilidad_con_plazo: number;
    costo_total: number;
    total_facturar: number;
    dificil_acceso: string;
  }): string {
    const reglas = [];
    const { auditoria } = BusinessRules;

    // Evaluar rentabilidad mínima (SIN plazo)
    if (presupuesto.rentabilidad < auditoria.rentabilidadMinima) {
      reglas.push(`Rentabilidad menor a ${auditoria.rentabilidadMinima}%`);
    }

    // Evaluar rentabilidad máxima (SIN plazo)
    if (presupuesto.rentabilidad > auditoria.rentabilidadMaxima) {
      reglas.push(`Rentabilidad superior a ${auditoria.rentabilidadMaxima}%`);
    }

    if (presupuesto.costo_total > auditoria.costoMaximo) {
      reglas.push(`Costo total superior a $${auditoria.costoMaximo.toLocaleString()}`);
    }

    const utilidad = presupuesto.total_facturar - presupuesto.costo_total;

    // Utilidad muy baja (sospecha error)
    if (utilidad < auditoria.utilidadMinimaBaja) {
      reglas.push(`Utilidad muy baja (menor a $${auditoria.utilidadMinimaBaja.toLocaleString()})`);
    }

    // Utilidad muy alta (sospecha sobreprecio)
    if (utilidad > auditoria.utilidadMinima) {
      reglas.push(`Utilidad superior a $${auditoria.utilidadMinima.toLocaleString()}`);
    }

    return reglas.length > 0 ? 'pendiente_prestacional' : 'pendiente_carga';
  }
}
