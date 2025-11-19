import { Request, Response, NextFunction } from 'express';
import { validateDNI } from '../utils/validators';

export const validateDNIMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const dni = req.body.dni || req.params.dni;
  
  if (!dni) {
    return res.status(400).json({ error: 'DNI es requerido' });
  }
  
  if (!validateDNI(dni)) {
    return res.status(400).json({ error: 'DNI inválido. Debe tener 7-8 dígitos' });
  }
  
  next();
};
