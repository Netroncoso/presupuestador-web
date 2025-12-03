import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Group, NumberInput, Button, Stack, Divider, Alert, Loader, Tooltip } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconInfoCircle } from '@tabler/icons-react';
import { api } from '../../api/api';

interface Configuracion {
  id: number;
  clave: string;
  valor: number;
  descripcion: string;
  categoria: string;
  unidad: string;
}

export default function GestionReglasNegocio() {
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
      setConfiguraciones(data);
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
      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
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

  const categorias = Array.from(new Set(configuraciones.map(c => c.categoria)));

  const getTooltipText = (clave: string): string => {
    const tooltips: Record<string, string> = {
      'alerta.financiador.cobranzaExtendida': '> 60 días → COBRANZA EXTENDIDA (rojo)\nEl financiador tarda demasiado, afecta flujo de caja.',
      'alerta.financiador.cobranzaLenta': '> 45 días → COBRANZA LENTA (amarillo)\nEl financiador tarda más de lo normal en pagar.',
      'alerta.financiador.tasaAlta': '> 5% → TASA ALTA (amarillo)\nTasa de interés alta que reduce la rentabilidad con plazo.',
      'alerta.monto.critico': '>= $150,000 → MONTO CRÍTICO (rojo)\nRequiere gestión especial y aprobación adicional.',
      'alerta.monto.elevado': '>= $100,000 → MONTO ELEVADO (naranja)\nRequiere revisión y aviso a las áreas correspondientes.',
      'alerta.rentabilidad.desaprobado': '< 10% → DESAPROBADO (rojo)\nRentabilidad muy baja o negativa. No viable.',
      'alerta.rentabilidad.mejorar': '10-15% → MEJORAR (naranja)\nRentabilidad baja. Renegociar valores o revisar costos.',
      'alerta.rentabilidad.autorizado': '15-20% → AUTORIZADO (amarillo)\nRentabilidad aceptable pero mejorable.',
      'alerta.rentabilidad.felicitaciones': '20-25% → FELICITACIONES (verde)\nBuena rentabilidad. Cumple objetivos comerciales.',
      'alerta.rentabilidad.superRentable': '25-35% → SUPER RENTABLE (azul)\nRentabilidad muy buena. Altamente rentable.',
      'alerta.rentabilidad.excepcional': '>= 35% → EXCEPCIONAL (violeta)\nRentabilidad excepcional. Márgenes óptimos.',
    };
    return tooltips[clave] || '';
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={3}>Reglas de Negocio</Title>
          <Text size="sm" c="dimmed">Configuración de parámetros del sistema</Text>
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

      {categorias.map(categoria => {
        const configs = configuraciones.filter(c => c.categoria === categoria);
        return (
          <Paper key={categoria} p="lg" withBorder>
            <Group gap="xs" mb="md">
              <Title order={4} tt="capitalize">{categoria}</Title>
              {categoria === 'auditoria' && (
                <Tooltip
                  multiline
                  w={300}
                  label={
                    <div>
                      <Text size="sm" fw={500} mb={4}>Reglas de auditoría automática:</Text>
                      <Text size="xs">• Rentabilidad &lt; 15%</Text>
                      <Text size="xs">• Costo total &gt; $150,000</Text>
                      <Text size="xs">• Rentabilidad con plazo &gt; 25%</Text>
                      <Text size="xs">• Utilidad &gt; $50,000</Text>
                    </div>
                  }
                >
                  <IconInfoCircle size={18} style={{ cursor: 'help', color: '#228be6' }} />
                </Tooltip>
              )}
              {categoria === 'financiero' && (
                <Tooltip
                  multiline
                  w={280}
                  label={
                    <div>
                      <Text size="sm" fw={500} mb={4}>Valores por defecto:</Text>
                      <Text size="xs">• Se usan cuando el financiador no tiene valores configurados</Text>
                      <Text size="xs">• Aplican en cálculo de rentabilidad con plazo</Text>
                    </div>
                  }
                >
                  <IconInfoCircle size={18} style={{ cursor: 'help', color: '#228be6' }} />
                </Tooltip>
              )}
              {categoria === 'paginacion' && (
                <Tooltip
                  multiline
                  w={280}
                  label={
                    <div>
                      <Text size="sm" fw={500} mb={4}>Control de listados:</Text>
                      <Text size="xs">• Limit: Máximo de registros por página</Text>
                      <Text size="xs">• Offset: Desde qué registro empezar (siempre 0)</Text>
                    </div>
                  }
                >
                  <IconInfoCircle size={18} style={{ cursor: 'help', color: '#228be6' }} />
                </Tooltip>
              )}
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
                  <NumberInput
                    value={config.valor}
                    onChange={(val) => handleChange(config.clave, Number(val))}
                    min={0}
                    step={config.unidad === '$' ? 1000 : 1}
                    decimalScale={config.unidad === '$' ? 0 : 2}
                    suffix={` ${config.unidad}`}
                    w={200}
                  />
                </Group>
              ))}
            </Stack>
          </Paper>
        );
      })}

      <Divider my="md" />

      <Alert icon={<IconAlertCircle size={16} />} color="blue">
        <Text size="sm" fw={500}>Información importante:</Text>
        <Text size="sm">
          • Los cambios afectan inmediatamente a todos los presupuestos nuevos<br />
          • Los presupuestos existentes mantienen sus valores originales<br />
          • Se recomienda notificar al equipo antes de realizar cambios significativos
        </Text>
      </Alert>
    </Stack>
  );
}
