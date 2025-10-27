export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateDNI = (dni: string): boolean => {
  return /^\d{7,8}$/.test(dni);
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return `${fieldName} es requerido`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value && value.length < minLength) {
    return `${fieldName} debe tener al menos ${minLength} caracteres`;
  }
  return null;
};

export const validateNumber = (value: any, fieldName: string): string | null => {
  if (value !== undefined && (isNaN(value) || typeof value !== 'number')) {
    return `${fieldName} debe ser un número válido`;
  }
  return null;
};