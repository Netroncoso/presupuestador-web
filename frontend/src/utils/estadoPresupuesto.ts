import { EstadoPresupuesto } from '../types';

export const getEstadoBadgeColor = (estado?: string): string => {
  switch (estado) {
    case 'aprobado':
      return 'green';
    case 'aprobado_condicional':
      return 'yellow';
    case 'rechazado':
      return 'red';
    case 'en_revision_administrativa':
    case 'en_revision_prestacional':
    case 'en_revision_general':
      return 'blue';
    case 'pendiente_administrativa':
    case 'pendiente_prestacional':
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
    borrador: 'BORRADOR',
    pendiente_administrativa: 'PENDIENTE G. ADMIN',
    en_revision_administrativa: 'EN REVISIÓN G. ADMIN',
    pendiente_prestacional: 'PENDIENTE G. PRESTACIONAL',
    en_revision_prestacional: 'EN REVISIÓN G. PRESTACIONAL',
    pendiente_general: 'PENDIENTE G. GENERAL',
    en_revision_general: 'EN REVISIÓN G. GENERAL',
    aprobado: 'APROBADO',
    aprobado_condicional: 'APROBADO CONDICIONAL',
    rechazado: 'RECHAZADO',
  };
  return labels[estado || ''] || estado?.toUpperCase() || 'BORRADOR';
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
