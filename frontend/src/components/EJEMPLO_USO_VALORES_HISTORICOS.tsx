/**
 * EJEMPLO DE USO: ModalValoresHistoricos
 * 
 * Este archivo muestra cómo integrar el modal de valores históricos
 * en cualquier componente que liste servicios/prestaciones
 */

import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ModalValoresHistoricos from './ModalValoresHistoricos';

// Ejemplo: Tabla de servicios con botón para ver histórico
export default function EjemploTablaServicios() {
  const [modalOpen, setModalOpen] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  const handleVerHistorico = (id: number, nombre: string) => {
    setServicioSeleccionado({ id, nombre });
    setModalOpen(true);
  };

  return (
    <>
      {/* Tu tabla de servicios */}
      <table>
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Valor Asignado</th>
            <th>Valor Facturar</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Consulta Médica</td>
            <td>$1,500</td>
            <td>$2,000</td>
            <td>
              {/* Botón para abrir modal de histórico */}
              <Tooltip title="Ver valores históricos">
                <IconButton 
                  size="small"
                  onClick={() => handleVerHistorico(123, 'Consulta Médica')}
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Modal de valores históricos */}
      {servicioSeleccionado && (
        <ModalValoresHistoricos
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setServicioSeleccionado(null);
          }}
          idServicio={servicioSeleccionado.id}
          nombreServicio={servicioSeleccionado.nombre}
        />
      )}
    </>
  );
}

/**
 * INTEGRACIÓN EN COMPONENTES EXISTENTES
 * 
 * 1. En tu componente de gestión de prestadores/servicios:
 *    - Importar ModalValoresHistoricos
 *    - Agregar estado para controlar apertura del modal
 *    - Agregar botón/icono en cada fila de la tabla
 * 
 * 2. El modal se encarga de:
 *    - Cargar el histórico de valores
 *    - Permitir agregar nuevos valores
 *    - Cerrar automáticamente períodos anteriores
 *    - Mostrar estado vigente/histórico
 * 
 * 3. Backend automáticamente:
 *    - Devuelve valores vigentes en /prestador/:id
 *    - Cierra períodos al guardar nuevos valores
 *    - Mantiene histórico completo
 */
