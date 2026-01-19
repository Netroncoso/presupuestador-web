import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminSucursalesService } from '../../services/adminSucursalesService';

export const getAllSucursales = asyncHandler(async (req: Request, res: Response) => {
  const sucursales = await adminSucursalesService.obtenerTodas();
  res.json(sucursales);
});

export const updateSucursal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { suc_porcentaje_dificil_acceso, suc_porcentaje_insumos } = req.body;
  
  const resultado = await adminSucursalesService.actualizar(id, {
    suc_porcentaje_dificil_acceso,
    suc_porcentaje_insumos
  });
  
  res.json(resultado);
});
