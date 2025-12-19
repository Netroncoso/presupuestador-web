import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ReportesFinancierosService } from '../services/reportesFinancierosService';

const reportesService = new ReportesFinancierosService();

export const obtenerKPIs = asyncHandler(async (req: Request, res: Response) => {
  const periodo = (req.query.periodo as string) || 'mes_actual';
  const kpis = await reportesService.obtenerKPIs(periodo);
  res.json(kpis);
});

export const obtenerRankingFinanciadores = asyncHandler(async (req: Request, res: Response) => {
  const periodo = (req.query.periodo as string) || 'mes_actual';
  const ranking = await reportesService.obtenerRankingFinanciadores(periodo);
  res.json(ranking);
});

export const obtenerRankingSucursales = asyncHandler(async (req: Request, res: Response) => {
  const periodo = (req.query.periodo as string) || 'mes_actual';
  const ranking = await reportesService.obtenerRankingSucursales(periodo);
  res.json(ranking);
});

export const obtenerAnalisisCostos = asyncHandler(async (req: Request, res: Response) => {
  const financiadorId = req.query.financiador_id as string;
  const servicioId = req.query.servicio_id as string;
  const periodo = (req.query.periodo as string) || 'mes_actual';
  
  const analisis = await reportesService.obtenerAnalisisCostos(financiadorId, servicioId, periodo);
  res.json(analisis);
});

export const obtenerPromediosGenerales = asyncHandler(async (req: Request, res: Response) => {
  const servicioId = req.query.servicio_id as string;
  const periodo = (req.query.periodo as string) || 'mes_actual';
  
  const promedios = await reportesService.obtenerPromediosGenerales(servicioId, periodo);
  res.json(promedios);
});

export const obtenerServiciosPorFinanciador = asyncHandler(async (req: Request, res: Response) => {
  const financiadorId = req.query.financiador_id as string;
  const periodo = (req.query.periodo as string) || 'mes_actual';
  
  const servicios = await reportesService.obtenerServiciosPorFinanciador(financiadorId, periodo);
  res.json(servicios);
});
