import React from 'react';
import { FinanciadorInfo, Prestacion } from '../types';
import { evaluarRentabilidad, evaluarMonto, evaluarPrestacionesExcedidas, evaluarFinanciador } from '../services/alertaService';
import { RentabilidadAlert } from '../components/alerts/RentabilidadAlert';
import { MontoAlert } from '../components/alerts/MontoAlert';
import { FinanciadorAlerts } from '../components/alerts/FinanciadorAlerts';
import { PrestacionExcedidaAlert } from '../components/alerts/PrestacionExcedidaAlert';

interface AlertaProps {
  presupuestoId: number | null;
  clienteNombre: string;
  totalInsumos: number;
  totalPrestaciones: number;
  totalFacturar: number;
  rentabilidad: number;
  financiadorId: string | null;
  financiadorInfo?: FinanciadorInfo;
  prestacionesSeleccionadas?: Prestacion[];
}

export const useAlertaCotizador = (props: AlertaProps): React.ReactNode[] => {
  const { 
    rentabilidad,
    totalFacturar,
    financiadorId,
    financiadorInfo,
    prestacionesSeleccionadas = []
  } = props;

  const [alertasConfig, setAlertasConfig] = React.useState<any[]>([]);
  const [alertas, setAlertas] = React.useState<React.ReactNode[]>([]);

  React.useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/alertas-servicios`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setAlertasConfig(data);
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
        const usandoPlazo = !!financiadorInfo?.dias_cobranza_real;
        alertas.push(
          React.createElement(RentabilidadAlert, {
            key: "rentabilidad",
            tipo: tipoRentabilidad,
            rentabilidad: rentabilidad,
            usandoPlazo: usandoPlazo
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

      setAlertas(alertas);
    };

    evaluarAlertas();
  }, [rentabilidad, totalFacturar, financiadorId, financiadorInfo, prestacionesSeleccionadas, alertasConfig]);

  return alertas;
};
