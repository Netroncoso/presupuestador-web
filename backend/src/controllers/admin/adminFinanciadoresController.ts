import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { financiadoresService } from '../../services/financiadoresService';

export const getAllFinanciadores = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string || '';

  const resultado = await financiadoresService.obtenerTodos(page, limit, search);
  res.json(resultado);
});

export const updateFinanciador = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id_acuerdo } = req.body;

  const resultado = await financiadoresService.actualizar(id, {
    activo,
    tasa_mensual,
    dias_cobranza_teorico,
    dias_cobranza_real,
    id_acuerdo
  });

  res.json(resultado);
});

export const getAcuerdos = asyncHandler(async (req: Request, res: Response) => {
  const acuerdos = await financiadoresService.obtenerAcuerdos();
  res.json(acuerdos);
});
