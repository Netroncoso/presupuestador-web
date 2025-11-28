import { useState, useCallback } from 'react';

export const useModalState = () => {
  const [modalAuditoriaAbierto, setModalAuditoriaAbierto] = useState(false);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [modalValidacionAbierto, setModalValidacionAbierto] = useState(false);

  const abrirModalAuditoria = useCallback(() => setModalAuditoriaAbierto(true), []);
  const cerrarModalAuditoria = useCallback(() => setModalAuditoriaAbierto(false), []);
  const abrirModalEdicion = useCallback(() => setModalEdicionAbierto(true), []);
  const cerrarModalEdicion = useCallback(() => setModalEdicionAbierto(false), []);
  const abrirModalValidacion = useCallback(() => setModalValidacionAbierto(true), []);
  const cerrarModalValidacion = useCallback(() => setModalValidacionAbierto(false), []);

  return {
    modalAuditoriaAbierto,
    modalEdicionAbierto,
    modalValidacionAbierto,
    abrirModalAuditoria,
    cerrarModalAuditoria,
    abrirModalEdicion,
    cerrarModalEdicion,
    abrirModalValidacion,
    cerrarModalValidacion,
  };
};
