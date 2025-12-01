import { useState, useMemo, useCallback } from 'react';
import { FinanciadorInfo, Prestacion } from '../types';
import {
  calcularCostoTotal,
  calcularTotalFacturar,
  calcularRentabilidad,
  calcularMargen,
  calcularUtilidadConPlazo,
  calcularRentabilidadConPlazo,
} from '../utils/calculations';

export const useTotales = (financiadorInfo?: FinanciadorInfo, prestacionesSeleccionadas: Prestacion[] = [], porcentajeInsumos: number = 0, soloLectura: boolean = false) => {
  const [totalInsumos, setTotalInsumos] = useState(0);
  const [totalPrestaciones, setTotalPrestaciones] = useState(0);
  const [totalFacturarPrestaciones, setTotalFacturarPrestaciones] = useState(0);
  const [totalesDesdeDB, setTotalesDesdeDB] = useState<any>(null);

  const costoTotal = useMemo(() => {
    if (totalesDesdeDB) {
      return Number(totalesDesdeDB.costoTotal) || 0;
    }
    return calcularCostoTotal(totalInsumos, totalPrestaciones);
  }, [totalInsumos, totalPrestaciones, totalesDesdeDB]);

  const totalFacturar = useMemo(() => {
    if (totalesDesdeDB) {
      return Number(totalesDesdeDB.totalFacturar) || 0;
    }
    return calcularTotalFacturar(totalInsumos, totalFacturarPrestaciones, porcentajeInsumos);
  }, [totalInsumos, totalFacturarPrestaciones, porcentajeInsumos, totalesDesdeDB]);

  const rentabilidad = useMemo(() => {
    if (totalesDesdeDB) {
      return Number(totalesDesdeDB.rentabilidad) || 0;
    }
    return calcularRentabilidad(costoTotal, totalFacturar);
  }, [costoTotal, totalFacturar, totalesDesdeDB]);

  const margenBasico = useMemo(() => 
    calcularMargen(costoTotal, totalFacturar),
    [costoTotal, totalFacturar]
  );

  const utilidadConPlazo = useMemo(() => 
    calcularUtilidadConPlazo(totalFacturar, costoTotal, financiadorInfo),
    [totalFacturar, costoTotal, financiadorInfo]
  );

  const margenConPlazo = useMemo(() => 
    calcularMargen(utilidadConPlazo, totalFacturar),
    [utilidadConPlazo, totalFacturar]
  );

  const rentabilidadConPlazo = useMemo(() => {
    if (totalesDesdeDB) {
      return Number(totalesDesdeDB.rentabilidadConPlazo) || 0;
    }
    return calcularRentabilidadConPlazo(utilidadConPlazo, costoTotal);
  }, [utilidadConPlazo, costoTotal, totalesDesdeDB]);

  const setTotalInsumosWrapper = useCallback((total: number) => {
    setTotalInsumos(total);
    if (!soloLectura) {
      setTotalesDesdeDB(null); // Limpiar cache para forzar recálculo solo en modo edición
    }
  }, [soloLectura]);

  const setTotalesPrestaciones = useCallback((costo: number, facturar: number) => {
    setTotalPrestaciones(costo);
    setTotalFacturarPrestaciones(facturar);
    if (!soloLectura) {
      setTotalesDesdeDB(null); // Limpiar cache para forzar recálculo solo en modo edición
    }
  }, [soloLectura]);

  const resetTotales = useCallback(() => {
    setTotalInsumos(0);
    setTotalPrestaciones(0);
    setTotalFacturarPrestaciones(0);
    setTotalesDesdeDB(null);
  }, []);

  const setTotalesDesdeBaseDatos = useCallback((totales: any) => {
    setTotalesDesdeDB(totales);
    // También actualizar los estados individuales para consistencia
    setTotalInsumos(totales.totalInsumos || 0);
    setTotalPrestaciones(totales.totalPrestaciones || 0);
  }, []);

  return {
    totalInsumos,
    totalPrestaciones,
    costoTotal,
    totalFacturar,
    rentabilidad,
    margenBasico,
    utilidadConPlazo,
    margenConPlazo,
    rentabilidadConPlazo,
    setTotalInsumos: setTotalInsumosWrapper,
    setTotalesPrestaciones,
    resetTotales,
    setTotalesDesdeBaseDatos,
  };
};
