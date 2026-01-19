import { EstadoPresupuesto } from '../types';

export const getEstadoBadgeColor = (estado?: string): string => {
  switch (estado) {
    case 'aprobado':
      return 'green';
    case 'aprobado_condicional':
      return 'yellow';
    case 'rechazado':
      return 'red';
    case 'en_revision_prestacional':
    case 'en_revision_comercial':
    case 'en_revision_general':
      return 'blue';
    case 'pendiente_prestacional':
    case 'pendiente_comercial':
    case 'pendiente_general':
      return 'orange';
    case 'borrador':
      return 'gray';
    default:
      return 'gray';
  }
};

export const getEstadoLabel = (estado?: string): string => {
  const labels: Record<string, string> = {
    borrador: 'Borrador',
    pendiente_prestacional: 'Pendiente G. Prestacional',
    en_revision_prestacional: 'En Revisión G. Prestacional',
    pendiente_comercial: 'Pendiente G. Comercial',
    en_revision_comercial: 'En Revisión G. Comercial',
    pendiente_general: 'Pendiente G. General',
    en_revision_general: 'En Revisión G. General',
    aprobado: 'Aprobado',
    aprobado_condicional: 'Aprobado Condicional',
    rechazado: 'Rechazado',
  };
  return labels[estado || ''] || estado || 'Borrador';
};

export const esEstadoEditable = (estado?: string): boolean => {
  return estado === 'borrador';
};

export const esEstadoFinal = (estado?: string): boolean => {
  return estado === 'aprobado' || estado === 'aprobado_condicional' || estado === 'rechazado';
};

export const esEstadoPendiente = (estado?: string): boolean => {
  return estado?.startsWith('pendiente_') || false;
};

export const esEstadoEnRevision = (estado?: string): boolean => {
  return estado?.startsWith('en_revision_') || false;
};
