import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const validateDNI = (dni: string): boolean => {
  return /^\d{7,8}$/.test(dni);
};

export const validateId = (id: string | number): boolean => {
  const numId = typeof id === 'string' ? parseInt(id) : id;
  return !isNaN(numId) && numId > 0;
};

export const sanitizeString = (str: string, maxLength: number = 255): string => {
  return str.trim().substring(0, maxLength);
};

export const validateRequired = (fields: Record<string, any>, requiredFields: string[]): void => {
  const missing = requiredFields.filter(field => !fields[field]);
  if (missing.length > 0) {
    throw new AppError(400, `Campos requeridos: ${missing.join(', ')}`);
  }
};

export const validateNumeric = (value: any, fieldName: string): number => {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    throw new AppError(400, `${fieldName} debe ser un número positivo`);
  }
  return num;
};
