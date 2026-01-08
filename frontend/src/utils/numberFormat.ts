/**
 * Utilidades centralizadas para formateo de números
 * Soporta formato argentino: $ 1.234,56
 */

export const numberFormat = {
  /**
   * Formatea número a moneda argentina
   * @example formatCurrency(1234.56) => "$ 1.234,56"
   */
  formatCurrency: (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '$ 0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$ 0,00';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  },

  /**
   * Formatea número sin símbolo de moneda
   * @example formatNumber(1234.56) => "1.234,56"
   */
  formatNumber: (value: number | string | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || value === '') return '0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0,00';
    
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  /**
   * Parsea string con formato argentino a número
   * @example parseNumber("1.234,56") => 1234.56
   * @example parseNumber("1234.56") => 1234.56 (también soporta formato US)
   */
  parseNumber: (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    // Remover espacios y símbolo de moneda
    let cleaned = value.replace(/[$\s]/g, '');
    
    // Detectar formato: si tiene punto antes de coma, es formato argentino
    if (cleaned.includes('.') && cleaned.includes(',')) {
      // Formato argentino: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Solo coma: 1234,56
      cleaned = cleaned.replace(',', '.');
    }
    // Si solo tiene punto, ya está en formato correcto: 1234.56
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Valida que un string sea un número válido
   */
  isValidNumber: (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    const num = numberFormat.parseNumber(value);
    return !isNaN(num) && isFinite(num);
  },

  /**
   * Formatea input mientras el usuario escribe
   * Permite escribir números con coma decimal
   */
  formatInput: (value: string): string => {
    // Permitir solo números, coma y punto
    let cleaned = value.replace(/[^\d.,]/g, '');
    
    // Permitir solo una coma o punto decimal
    const parts = cleaned.split(/[.,]/);
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Reemplazar punto por coma (formato argentino)
    cleaned = cleaned.replace('.', ',');
    
    return cleaned;
  },
};

/**
 * Hook para manejar inputs numéricos con formato argentino
 */
export const useNumberInput = (initialValue: number = 0) => {
  const [displayValue, setDisplayValue] = React.useState(
    numberFormat.formatNumber(initialValue)
  );
  const [numericValue, setNumericValue] = React.useState(initialValue);

  const handleChange = (value: string) => {
    const formatted = numberFormat.formatInput(value);
    setDisplayValue(formatted);
    
    const numeric = numberFormat.parseNumber(formatted);
    setNumericValue(numeric);
  };

  const handleBlur = () => {
    // Formatear al perder foco
    setDisplayValue(numberFormat.formatNumber(numericValue));
  };

  return {
    displayValue,
    numericValue,
    handleChange,
    handleBlur,
    setValue: (value: number) => {
      setNumericValue(value);
      setDisplayValue(numberFormat.formatNumber(value));
    },
  };
};

// Re-exportar React para el hook
import React from 'react';
