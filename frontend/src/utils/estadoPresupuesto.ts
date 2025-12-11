export type EstadoPresupuesto = 'borrador' | 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';

export const getEstadoBadgeColor = (estado?: string): string => {
  switch (estado) {
    case 'aprobado':
      return 'green';
    case 'rechazado':
      return 'red';
    case 'en_revision':
      return 'blue';
    case 'pendiente':
      return 'yellow';
    default:
      return 'gray';
  }
};

export const getEstadoLabel = (estado?: string): string => {
  return estado?.toUpperCase() || 'BORRADOR';
};
