import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { financiadoresService } from '../../services/financiadoresService';

export const getAllPrestadores = asyncHandler(async (req: Request, res: Response) => {
  const prestadores = await financiadoresService.obtenerTodos();
  res.json(prestadores);
});

export const updatePrestador = asyncHandler(async (req: Request, res: Response) => {
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