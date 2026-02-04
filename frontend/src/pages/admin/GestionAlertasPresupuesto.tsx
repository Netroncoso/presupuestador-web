import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Group, NumberInput, Button, Stack, Alert, Loader, Tooltip } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconInfoCircle } from '@tabler/icons-react';
import { api } from '../../api/api';
import { CurrencyInput } from '../../components/CurrencyInput';

interface Configuracion {
  id: number;
  clave: string;
  valor: number;
  descripcion: string;
  categoria: string;
  unidad: string;
}

export default function GestionAlertasPresupuesto() {
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const { data } = await api.get('/configuracion');
      setConfiguraciones(data.filter((c: Configuracion) => c.categoria === 'alerta'));
    } catch (err: any) {
      setError(err.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (clave: string, valor: number) => {
    setConfiguraciones(prev =>
      prev.map(c => c.clave === clave ? { ...c, valor } : c)
    );
  };

  const handleGuardar = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/configuracion/multiple', { configuraciones });
      setSuccess('Alertas guardadas exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar alertas');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper p="xl" withBorder>
        <Group justify="center">
          <Loader size="lg" />
        </Group>
      </Paper>
    );
  }

  const getTooltipText = (clave: string): string => {
    const tooltips: Record<string, string> = {
      'alerta.financiador.cobranzaExtendida': '> 60 días → COBRANZA EXTENDIDA (rojo)\nEl financiador tarda demasiado, afecta flujo de caja.',
      'alerta.financiador.cobranzaLenta': '> 50 días → COBRANZA LENTA (amarillo)\nEl financiador tarda más de lo normal en pagar.',
      'alerta.financiador.tasaAlta': '> 5% → TASA ALTA (amarillo)\nTasa de interés alta que reduce la rentabilidad con plazo.',
      'alerta.monto.critico': '>= $3,000,000 → MONTO CRÍTICO (rojo)\nRequiere gestión especial y aprobación adicional.',
      'alerta.monto.elevado': '>= $2,000,000 → MONTO ELEVADO (naranja)\nRequiere revisión y aviso a las áreas correspondientes.',
      'alerta.rentabilidad.desaprobado': '< 20% → DESAPROBADO (rojo)\nRentabilidad muy baja. Requiere auditoría.',
      'alerta.rentabilidad.mejorar': '20-40% → MEJORAR (naranja)\nRentabilidad baja. Revisar costos o renegociar.',
      'alerta.rentabilidad.felicitaciones': '40-70% → FELICITACIONES (verde)\nExcelente rentabilidad. Cumple objetivos.',
      'alerta.rentabilidad.excepcional': '>= 70% → EXCEPCIONAL (violeta)\nRentabilidad excepcional. Márgenes óptimos.',
      'alerta.utilidad.critica': '< $100,000 → CRÍTICA (rojo)\nUtilidad muy baja.',
      'alerta.utilidad.baja': '< $200,000 → BAJA (naranja)\nUtilidad baja.',
      'alerta.utilidad.buena': '>= $500,000 → BUENA (verde)\nUtilidad buena.',
      'alerta.utilidad.excelente': 'Utilidad excelente (violeta)\nUtilidad excepcional.',
    };
    return tooltips[clave] || '';
  };

  const subcategorias = [
    { key: 'financiador', label: 'Financiador', tooltip: 'Alertas relacionadas con días de cobranza y tasas de interés' },
    { key: 'monto', label: 'Monto', tooltip: 'Alertas basadas en el monto total del presupuesto' },
    { key: 'rentabilidad', label: 'Rentabilidad', tooltip: 'Alertas basadas en el porcentaje de rentabilidad' },
    { key: 'utilidad', label: 'Utilidad', tooltip: 'Alertas basadas en la utilidad en pesos' }
  ];

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={3}>Alertas de Presupuesto</Title>
          <Text size="sm" c="dimmed">Configuración de umbrales para alertas visuales</Text>
        </div>
        <Button
          leftSection={<IconDeviceFloppy size={18} />}
          onClick={handleGuardar}
          loading={saving}
          color="green"
        >
          Guardar Cambios
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert icon={<IconCheck size={16} />} color="green" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {subcategorias.map(subcat => {
        const configs = configuraciones.filter(c => c.clave.includes(`.${subcat.key}.`));
        if (configs.length === 0) return null;
        
        return (
          <Paper key={subcat.key} p="lg" withBorder>
            <Group gap="xs" mb="md">
              <Title order={4}>{subcat.label}</Title>
              <Tooltip multiline w={300} label={subcat.tooltip}>
                <IconInfoCircle size={18} style={{ cursor: 'help', color: '#228be6' }} />
              </Tooltip>
            </Group>
            <Stack gap="md">
              {configs.map(config => (
                <Group key={config.clave} justify="space-between" align="flex-start">
                  <Tooltip
                    label={getTooltipText(config.clave)}
                    disabled={!getTooltipText(config.clave)}
                    w={300}
                    multiline
                    withArrow
                  >
                    <div style={{ flex: 1, cursor: getTooltipText(config.clave) ? 'help' : 'default' }}>
                      <Text fw={500}>{config.descripcion}</Text>
                      <Text size="xs" c="dimmed">{config.clave}</Text>
                    </div>
                  </Tooltip>
                  {config.unidad === '$' ? (
                    <CurrencyInput
                      value={config.valor}
                      onChange={(val) => handleChange(config.clave, Number(val))}
                      min={0}
                      step={1000}
                      w={200}
                    />
                  ) : (
                    <NumberInput
                      value={config.valor}
                      onChange={(val) => handleChange(config.clave, Number(val))}
                      min={0}
                      step={1}
                      decimalScale={2}
                      suffix={` ${config.unidad}`}
                      thousandSeparator="."
                      decimalSeparator=","
                      w={200}
                    />
                  )}
                </Group>
              ))}
            </Stack>
          </Paper>
        );
      })}

      <Alert icon={<IconAlertCircle size={16} />} color="blue">
        <Text size="sm" fw={500}>Información importante:</Text>
        <Text size="sm">
          • Las alertas son visuales y no bloquean la creación de presupuestos<br />
          • Los colores ayudan a identificar rápidamente situaciones que requieren atención<br />
          • Los cambios se aplican inmediatamente a todos los presupuestos
        </Text>
      </Alert>
    </Stack>
  );
}
