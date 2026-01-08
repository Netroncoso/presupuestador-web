import React from 'react';
import { TextInput, TextInputProps } from '@mantine/core';
import { numberFormat } from '../utils/numberFormat';

interface NumberInputProps extends Omit<TextInputProps, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
  prefix?: string;
  allowNegative?: boolean;
}

/**
 * Input numérico con formato argentino (1.234,56)
 * Centraliza el formateo para toda la aplicación
 * 
 * @example
 * <NumberInput
 *   label="Precio"
 *   value={precio}
 *   onChange={setPrecio}
 *   decimals={2}
 *   prefix="$"
 * />
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  decimals = 2,
  prefix = '',
  allowNegative = false,
  ...props
}) => {
  const [displayValue, setDisplayValue] = React.useState(
    numberFormat.formatNumber(value, decimals)
  );
  const [isFocused, setIsFocused] = React.useState(false);

  // Sincronizar con valor externo
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(numberFormat.formatNumber(value, decimals));
    }
  }, [value, decimals, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remover prefijo si existe
    if (prefix) {
      inputValue = inputValue.replace(prefix, '').trim();
    }

    // Permitir solo números, coma, punto y opcionalmente signo negativo
    const regex = allowNegative ? /[^\d.,-]/g : /[^\d.,]/g;
    let cleaned = inputValue.replace(regex, '');

    // Permitir solo una coma o punto decimal
    const parts = cleaned.split(/[.,]/);
    if (parts.length > 2) {
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    } else if (parts.length === 2) {
      cleaned = parts[0] + ',' + parts[1];
    }

    setDisplayValue(cleaned);

    // Parsear y notificar cambio
    const numericValue = numberFormat.parseNumber(cleaned);
    onChange(numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Mostrar valor sin formato para edición más fácil
    setDisplayValue(value.toString().replace('.', ','));
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Formatear al perder foco
    setDisplayValue(numberFormat.formatNumber(value, decimals));
  };

  return (
    <TextInput
      {...props}
      value={prefix && !isFocused ? `${prefix} ${displayValue}` : displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};
