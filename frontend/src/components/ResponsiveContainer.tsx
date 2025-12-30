import { Container, ContainerProps } from '@mantine/core';

interface ResponsiveContainerProps extends Omit<ContainerProps, 'fluid'> {
  children: React.ReactNode;
}

/**
 * Container que siempre usa todo el ancho disponible
 */
export default function ResponsiveContainer({ children, ...props }: ResponsiveContainerProps) {
  return (
    <Container 
      fluid
      {...props}
    >
      {children}
    </Container>
  );
}
