const getAccionDescripcion = (estadoAnterior: string, estadoNuevo: string, auditor: string) => {
  // Si estado nuevo es pendiente_administrativa, siempre es solicitud de auditoría
  if (estadoNuevo === 'pendiente_administrativa') {
    return `${auditor} solicitó auditoría`;
  }
  
  const acciones: Record<string, string> = {
    'en_revision_administrativa_pendiente_prestacional': 'derivó a G. Prestacional',
    'en_revision_prestacional_pendiente_general': 'escaló a G. General',
    'en_revision_administrativa_aprobado': 'aprobó',
    'en_revision_prestacional_aprobado': 'aprobó',
    'en_revision_general_aprobado': 'aprobó',
    'en_revision_administrativa_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_prestacional_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_general_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_administrativa_rechazado': 'rechazó',
    'en_revision_prestacional_rechazado': 'rechazó',
    'en_revision_general_rechazado': 'rechazó',
    'en_revision_prestacional_observado': 'devolvió para correcciones',
    'en_revision_prestacional_borrador': 'devolvió para correcciones',
    'en_revision_general_pendiente_administrativa': 'devolvió a G. Administrativa',
    'en_revision_general_pendiente_prestacional': 'devolvió a G. Prestacional',
  };
  
  const key = `${estadoAnterior}_${estadoNuevo}`;
  const accion = acciones[key] || 'cambió el estado';
  
  return `${auditor} ${accion}`;
};
