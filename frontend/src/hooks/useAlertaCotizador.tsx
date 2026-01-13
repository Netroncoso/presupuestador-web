import React from 'react';
import { FinanciadorInfo, Prestacion } from '../types';
import { evaluarRentabilidad, evaluarMonto, evaluarUtilidad, evaluarPrestacionesExcedidas, evaluarEquipamientosExcedidos, evaluarFinanciador } from '../services/alertaService';
import { RentabilidadAlert } from '../components/alerts/RentabilidadAlert';
import { MontoAlert } from '../components/alerts/MontoAlert';
import { UtilidadAlert } from '../components/alerts/UtilidadAlert';
import { FinanciadorAlerts } from '../components/alerts/FinanciadorAlerts';
import { PrestacionExcedidaAlert } from '../components/alerts/PrestacionExcedidaAlert';
import { EquipamientoExcedidoAlert } from '../components/alerts/EquipamientoExcedidoAlert';

interface AlertaProps {
  presupuestoId: number | null;
  clienteNombre: string;
  totalInsumos: number;
  totalPrestaciones: number;
  totalFacturar: number;
  costoTotal: number;
  rentabilidad: number;
  financiadorId: string | null;
  financiadorInfo?: FinanciadorInfo;
  prestacionesSeleccionadas?: Prestacion[];
  equipamientosSeleccionados?: any[];
}

export const useAlertaCotizador = (props: AlertaProps): React.ReactNode[] => {
  const { 
    rentabilidad,
    totalFacturar,
    costoTotal,
    financiadorId,
    financiadorInfo,
    prestacionesSeleccionadas = [],
    equipamientosSeleccionados = []
  } = props;

  const [alertasConfig, setAlertasConfig] = React.useState<any[]>([]);
  const [alertasEquipamientosConfig, setAlertasEquipamientosConfig] = React.useState<any[]>([]);
  const [alertas, setAlertas] = React.useState<React.ReactNode[]>([]);

  React.useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:4000';
        const [serviciosRes, equipamientosRes] = await Promise.all([
          fetch(`${apiUrl}/api/alertas-servicios`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`${apiUrl}/api/alertas-equipamientos`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        const serviciosData = await serviciosRes.json();
        const equipamientosData = await equipamientosRes.json();
        setAlertasConfig(serviciosData);
        setAlertasEquipamientosConfig(equipamientosData);
      } catch (error) {
        console.error('Error cargando alertas:', error);
      }
    };
    cargarAlertas();
  }, []);
  
  React.useEffect(() => {
    const evaluarAlertas = async () => {
      const alertas: React.ReactNode[] = [];

      // Alerta de rentabilidad
      const tipoRentabilidad = await evaluarRentabilidad(rentabilidad);
      if (tipoRentabilidad) {
        alertas.push(
          React.createElement(RentabilidadAlert, {
            key: "rentabilidad",
            tipo: tipoRentabilidad,
            rentabilidad: rentabilidad,
            usandoPlazo: false
          })
        );
      }

      // Alerta de utilidad
      const utilidad = totalFacturar - costoTotal;
      const tipoUtilidad = await evaluarUtilidad(utilidad);
      if (tipoUtilidad) {
        alertas.push(
          React.createElement(UtilidadAlert, {
            key: "utilidad",
            tipo: tipoUtilidad,
            utilidad: utilidad
          })
        );
      }

      // Alerta de monto
      const tipoMonto = await evaluarMonto(totalFacturar);
      if (tipoMonto) {
        alertas.push(
          React.createElement(MontoAlert, {
            key: "monto",
            tipo: tipoMonto,
            totalFacturar: totalFacturar
          })
        );
      }

      // Alertas de financiador
      if (financiadorInfo && financiadorId) {
        const evaluacion = await evaluarFinanciador(financiadorInfo);
        if (evaluacion) {
          alertas.push(
            React.createElement(FinanciadorAlerts, {
              key: "financiador",
              requiereAutorizacion: evaluacion.requiereAutorizacion,
              cobranzaExtendida: !!evaluacion.cobranzaExtendida,
              cobranzaLenta: !!evaluacion.cobranzaLenta,
              tasaAlta: !!evaluacion.tasaAlta,
              convenioFirmado: evaluacion.convenioFirmado,
              diasCobranza: evaluacion.diasCobranza,
              tasaMensual: evaluacion.tasaMensual
            })
          );
        }
      }

      // Alertas de prestaciones excedidas
      if (alertasConfig.length > 0) {
        const prestacionesExcedidas = evaluarPrestacionesExcedidas(prestacionesSeleccionadas, alertasConfig);
        prestacionesExcedidas.forEach((p, idx) => {
          alertas.push(
            React.createElement(PrestacionExcedidaAlert, {
              key: `prestacion-${idx}`,
              prestacion: p
            })
          );
        });
      }

      // Alertas de equipamientos excedidos
      if (alertasEquipamientosConfig.length > 0) {
        const equipamientosExcedidos = evaluarEquipamientosExcedidos(equipamientosSeleccionados, alertasEquipamientosConfig);
        equipamientosExcedidos.forEach((eq, idx) => {
          alertas.push(
            React.createElement(EquipamientoExcedidoAlert, {
              key: `equipamiento-${idx}`,
              equipamiento: eq
            })
          );
        });
      }

      setAlertas(alertas);
    };

    evaluarAlertas();
  }, [rentabilidad, totalFacturar, costoTotal, financiadorId, financiadorInfo, prestacionesSeleccionadas, equipamientosSeleccionados, alertasConfig, alertasEquipamientosConfig]);

  return alertas;
};
