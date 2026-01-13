import { NumberInput, NumberInputProps } from '@mantine/core';

/**
 * Input de moneda con formato argentino centralizado
 * Formato: $ 1.235 (sin decimales, punto de miles)
 */
export const CurrencyInput = (props: NumberInputProps) => {
  return (
    <NumberInput
      decimalScale={0}
      thousandSeparator="."
      decimalSeparator=","
      prefix="$ "
      {...props}
    />
  );
};
