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

export const useTotales = (financiadorInfo?: FinanciadorInfo, prestacionesSeleccionadas: Prestacion[] = [], porcentajeInsumos: number = 0) => {
  const [totalInsumos, setTotalInsumos] = useState(0);
  const [totalPrestaciones, setTotalPrestaciones] = useState(0);
  const [totalFacturarPrestaciones, setTotalFacturarPrestaciones] = useState(0);

  const costoTotal = useMemo(() => 
    calcularCostoTotal(totalInsumos, totalPrestaciones), 
    [totalInsumos, totalPrestaciones]
  );

  const totalFacturar = useMemo(() => 
    calcularTotalFacturar(totalInsumos, totalFacturarPrestaciones, porcentajeInsumos), 
    [totalInsumos, totalFacturarPrestaciones, porcentajeInsumos]
  );

  const rentabilidad = useMemo(() => 
    calcularRentabilidad(costoTotal, totalFacturar),
    [costoTotal, totalFacturar]
  );

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

  const rentabilidadConPlazo = useMemo(() => 
    calcularRentabilidadConPlazo(utilidadConPlazo, costoTotal),
    [utilidadConPlazo, costoTotal]
  );

  const resetTotales = useCallback(() => {
    setTotalInsumos(0);
    setTotalPrestaciones(0);
    setTotalFacturarPrestaciones(0);
  }, []);

  const setTotalesPrestaciones = useCallback((costo: number, facturar: number) => {
    setTotalPrestaciones(costo);
    setTotalFacturarPrestaciones(facturar);
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
    setTotalInsumos,
    setTotalesPrestaciones,
    resetTotales,
  };
};
