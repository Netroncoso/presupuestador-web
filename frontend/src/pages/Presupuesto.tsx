import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Tabs, TextInput, Button, Select, Checkbox, NumberInput, Group, Text, Divider, Loader } from '@mantine/core';
import { MantineReactTable } from 'mantine-react-table';
import type { MRT_ColumnDef } from 'mantine-react-table';
import { showNotification } from '@mantine/notifications';
import { getSucursales, crearPresupuesto, getInsumos, getPrestadores, getPrestacionesPorPrestador, actualizarTotales } from '../api/api';

type Insumo = { producto: string; costo: number };
type Prestacion = { id_servicio: number; nombre: string; costo: number; total_mes: number; condicion: string; cant_total: number };

export default function PresupuestoPage() {
  const [active, setActive] = useState<string | null>('datos');
  const [sucursales, setSucursales] = useState<string[]>([]);
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [sucursal, setSucursal] = useState<string | null>(null);
  const [dificil, setDificil] = useState(false);

  const [presupuestoId, setPresupuestoId] = useState<number | null>(null);

  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Insumos
  const [insumosDisponibles, setInsumosDisponibles] = useState<Insumo[]>([]);
  const [filtroInsumos, setFiltroInsumos] = useState('');
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<{ producto: string; costo: number; cantidad: number }[]>([]);
  const [cantidadesInsumos, setCantidadesInsumos] = useState<Record<string, number>>({});

  // Prestaciones
  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [prestadorSeleccionado, setPrestadorSeleccionado] = useState<string | null>(null);
  const [prestacionesDisponibles, setPrestacionesDisponibles] = useState<Prestacion[]>([]);
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState<{ id_servicio: number; prestacion: string; cantidad: number; valor_asignado: number }[]>([]);
  const [entradasPrestaciones, setEntradasPrestaciones] = useState<Record<number, { cantidad: number; valor: number }>>({});
  const [loadingPrestaciones, setLoadingPrestaciones] = useState(false);

  useEffect(() => {
    getSucursales().then(rows => setSucursales(rows.map((r: any) => r.Sucursales_mh))).catch(console.error);
    getInsumos().then(setInsumosDisponibles).catch(console.error);
    getPrestadores().then(setPrestadores).catch(console.error);
  }, []);

  const insumosFiltrados = useMemo(() => {
    const q = filtroInsumos.toLowerCase();
    return insumosDisponibles.filter(i => i.producto.toLowerCase().includes(q));
  }, [filtroInsumos, insumosDisponibles]);

  const agregarInsumo = (producto: string, costo: number, cantidad: number) => {
    setInsumosSeleccionados(prev => {
      const idx = prev.findIndex(p => p.producto === producto);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { producto, costo, cantidad };
        return copy;
      }
      return [...prev, { producto, costo, cantidad }];
    });
    showNotification({ title: 'Insumo agregado', message: `${producto} x ${cantidad}` });
  };

  const eliminarInsumo = (producto: string) => {
    setInsumosSeleccionados(prev => prev.filter(p => p.producto !== producto));
  };

  const totalInsumos = insumosSeleccionados.reduce((s, i) => s + i.costo * i.cantidad, 0);
  const totalPrestaciones = prestacionesSeleccionadas.reduce((s, p) => s + p.cantidad * p.valor_asignado, 0);

  const formatCurrency = useCallback((n: number) => {
    try {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(n);
    } catch {
      return `$${n.toFixed(2)}`;
    }
  }, []);

  const crear = async () => {
    if (!nombre || !dni || !sucursal) return showNotification({ title: 'Error', message: 'Complete todos los campos', color: 'red' });
    try {
      setCreando(true);
      const r = await crearPresupuesto({ nombre, dni, sucursal, dificil_acceso: dificil ? 'si' : 'no' });
      setPresupuestoId(r.id);
      setActive('insumos');
      showNotification({ title: 'Presupuesto creado', message: 'ID: ' + r.id });
    } catch (err) {
      console.error('Error creating presupuesto:', err instanceof Error ? err.message : 'Unknown error');
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear presupuesto';
      showNotification({ title: 'Error', message: errorMessage, color: 'red' });
    }
    finally {
      setCreando(false);
    }
  };

  const cargarPrestador = async (id: string) => {
    if (!id) return;
    try {
      setLoadingPrestaciones(true);
      const prestaciones = await getPrestacionesPorPrestador(id);
      const mapped = prestaciones.map((p: any) => ({ id_servicio: p.id_servicio, nombre: p.nombre, costo: p.costo, total_mes: p.total_mes, condicion: p.condicion, cant_total: p.cant_total }));
      setPrestacionesDisponibles(mapped);
      // initialize inputs
      const inputs: Record<number, { cantidad: number; valor: number }> = {};
      mapped.forEach((m: any) => { inputs[m.id_servicio] = { cantidad: 1, valor: m.costo }; });
      setEntradasPrestaciones(inputs);
    } catch (err) {
      console.error('Error loading prestaciones:', err instanceof Error ? err.message : 'Unknown error');
      const errorMessage = err instanceof Error ? err.message : 'No se pudieron cargar prestaciones';
      showNotification({ title: 'Error', message: errorMessage, color: 'red' });
    }
    finally {
      setLoadingPrestaciones(false);
    }
  };

  const agregarPrestacion = (p: Prestacion, cantidad: number, valor_asignado: number) => {
    // compute new array and emit update so parent App can stay in sync
    setPrestacionesSeleccionadas(prev => {
      const idx = prev.findIndex(x => x.id_servicio === p.id_servicio);
      let next: any[];
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { id_servicio: p.id_servicio, prestacion: p.nombre, cantidad, valor_asignado };
        next = copy;
      } else {
        next = [...prev, { id_servicio: p.id_servicio, prestacion: p.nombre, cantidad, valor_asignado }];
      }
      // emit updated prestaciones for global UI
      const total = next.reduce((s, it) => s + it.cantidad * it.valor_asignado, 0);
      try { window.dispatchEvent(new CustomEvent('prestacionesUpdated', { detail: { prestaciones: next, total } })); } catch (e) { /* ignore */ }
      return next;
    });
    showNotification({ title: 'Prestación agregada', message: `${p.nombre} x ${cantidad}` });
  };

  const actualizarPrestacionSeleccionada = (id_servicio: number, changes: { cantidad?: number; valor_asignado?: number }) => {
    setPrestacionesSeleccionadas(prev => {
      const next = prev.map(p => p.id_servicio === id_servicio ? { ...p, ...changes } : p);
      const total = next.reduce((s, it) => s + it.cantidad * it.valor_asignado, 0);
      try { window.dispatchEvent(new CustomEvent('prestacionesUpdated', { detail: { prestaciones: next, total } })); } catch (e) { }
      return next;
    });
  };

  const eliminarPrestacion = (id_servicio: number) => {
    setPrestacionesSeleccionadas(prev => {
      const next = prev.filter(p => p.id_servicio !== id_servicio);
      const total = next.reduce((s, it) => s + it.cantidad * it.valor_asignado, 0);
      try { window.dispatchEvent(new CustomEvent('prestacionesUpdated', { detail: { prestaciones: next, total } })); } catch (e) { }
      return next;
    });
  };

  const guardarTodo = async () => {
    if (!presupuestoId) return showNotification({ title: 'Error', message: 'No hay presupuesto creado', color: 'red' });
    try {
      setGuardando(true);
      await actualizarTotales(presupuestoId, { total_insumos: totalInsumos, total_prestaciones: totalPrestaciones });
      showNotification({ title: 'Guardado', message: 'Totales guardados correctamente' });
    } catch (err) {
      console.error('Error saving totales:', err instanceof Error ? err.message : 'Unknown error');
      const errorMessage = err instanceof Error ? err.message : 'No se pudieron guardar totales';
      showNotification({ title: 'Error', message: errorMessage, color: 'red' });
    }
    finally {
      setGuardando(false);
    }
  };

  return (
    <Tabs value={active} onChange={(v: any) => setActive(typeof v === 'string' ? v : null)}>
      <Tabs.List>
        <Tabs.Tab value="datos">Datos del Presupuesto</Tabs.Tab>
        <Tabs.Tab value="insumos">Insumos</Tabs.Tab>
        <Tabs.Tab value="prestaciones">Prestaciones</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="datos" pt="xs">
        <TextInput label="Nombre y Apellido" value={nombre} onChange={(e) => setNombre(e.currentTarget.value)} />
        <TextInput label="DNI" value={dni} onChange={(e) => setDni(e.currentTarget.value)} />
        <Select label="Sucursal" data={sucursales.map(s => ({ value: s, label: s }))} value={sucursal} onChange={setSucursal} placeholder="Seleccione una sucursal" />
        <Checkbox label="Dificil Acceso" checked={dificil} onChange={(e) => setDificil(e.currentTarget.checked)} />
        <Group mt="md">
          <Button onClick={crear}>Guardar y Continuar</Button>
        </Group>
      </Tabs.Panel>

      <Tabs.Panel value="insumos" pt="xs">
        <Group>
          <TextInput placeholder="Filtrar insumos..." value={filtroInsumos} onChange={(e) => setFiltroInsumos(e.currentTarget.value)} style={{ flex: 1 }} />
        </Group>
        <Group mt="sm" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700 }}>Insumos disponibles</Text>
            {insumosFiltrados.length === 0 ? (
              <Text color="dimmed">No hay insumos que coincidan</Text>
            ) : (
              <MantineReactTable
                columns={[
                  { accessorKey: 'producto', header: 'Producto' },
                  { accessorKey: 'costo', header: 'Costo', Cell: ({ cell }) => formatCurrency(Number(cell.getValue())) },
                  {
                    id: 'accion', header: 'Acción', Cell: ({ row }) => {
                      const i = row.original as Insumo;
                      return (
                        <Group>
                          <NumberInput min={1} value={cantidadesInsumos[i.producto] ?? 1} onChange={(val) => setCantidadesInsumos(prev => ({ ...prev, [i.producto]: (typeof val === 'number' ? val : Number(val) || 1) }))} style={{ width: 100 }} />
                          <Button size="xs" disabled={creando} onClick={() => agregarInsumo(i.producto, i.costo, cantidadesInsumos[i.producto] ?? 1)}>Agregar</Button>
                        </Group>
                      );
                    }
                  } as MRT_ColumnDef<Insumo>
                ]}
                data={insumosFiltrados}
                enableColumnActions={false}
                enableSorting={false}
                enableTopToolbar={false}
                enableBottomToolbar={false}
              />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700 }}>Insumos seleccionados</Text>
            {insumosSeleccionados.length === 0 ? (
              <Text color="dimmed">No hay insumos seleccionados</Text>
            ) : (
              <MantineReactTable
                columns={[
                  { accessorKey: 'producto', header: 'Producto' },
                  { accessorKey: 'cantidad', header: 'Cantidad' },
                  { accessorKey: 'costo', header: 'Costo Unit.', Cell: ({ cell }) => formatCurrency(Number(cell.getValue())) },
                  { id: 'subtotal', header: 'Subtotal', Cell: ({ row }) => formatCurrency(row.original.costo * row.original.cantidad) } as MRT_ColumnDef<any>,
                  { id: 'accion', header: '', Cell: ({ row }) => <Button color="red" size="xs" onClick={() => eliminarInsumo(row.original.producto)}>Eliminar</Button> } as MRT_ColumnDef<any>,
                ]}
                data={insumosSeleccionados}
                enableColumnActions={false}
                enableSorting={false}
                enableTopToolbar={false}
                enableBottomToolbar={false}
              />
            )}
            <Divider my="sm" />
            <Text>Total Insumos: {formatCurrency(totalInsumos)}</Text>
          </div>
        </Group>
      </Tabs.Panel>

      <Tabs.Panel value="prestaciones" pt="xs">
        <Group>
          <Select label="Prestador" placeholder="Seleccione un prestador" data={prestadores.map(p => ({ value: String(p.idobra_social), label: p.Prestador }))} value={prestadorSeleccionado} onChange={(v) => { setPrestadorSeleccionado(v); cargarPrestador(v || ''); }} style={{ flex: 1 }} />
        </Group>

        <Group mt="sm" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700 }}>Prestaciones disponibles</Text>
            {loadingPrestaciones ? (
              <Group><Loader size="xs" /> <Text color="dimmed">Cargando prestaciones...</Text></Group>
            ) : prestacionesDisponibles.length === 0 ? (
              <Text color="dimmed">Seleccione un prestador para ver prestaciones</Text>
            ) : (
              <MantineReactTable
                columns={[
                  { accessorKey: 'nombre', header: 'Prestación' },
                  { accessorKey: 'costo', header: 'Costo', Cell: ({ cell }) => formatCurrency(Number(cell.getValue())) },
                  { accessorKey: 'condicion', header: 'Condición' },
                  {
                    id: 'accion', header: 'Acción', Cell: ({ row }) => {
                      const p = row.original as Prestacion;
                      return (
                        <Group>
                          <NumberInput min={1} value={entradasPrestaciones[p.id_servicio]?.cantidad ?? 1} onChange={(val) => setEntradasPrestaciones(prev => ({ ...prev, [p.id_servicio]: { cantidad: (typeof val === 'number' ? val : Number(val) || 1), valor: prev[p.id_servicio]?.valor ?? p.costo } }))} style={{ width: 100 }} />
                          <NumberInput min={0} step={0.01} value={entradasPrestaciones[p.id_servicio]?.valor ?? p.costo} onChange={(val) => setEntradasPrestaciones(prev => ({ ...prev, [p.id_servicio]: { cantidad: prev[p.id_servicio]?.cantidad ?? 1, valor: (typeof val === 'number' ? val : Number(val) || p.costo) } }))} style={{ width: 140 }} />
                          <Button size="xs" onClick={() => { const inp = entradasPrestaciones[p.id_servicio] ?? { cantidad: 1, valor: p.costo }; agregarPrestacion(p, inp.cantidad, inp.valor); }}>Agregar</Button>
                        </Group>
                      );
                    }
                  } as MRT_ColumnDef<Prestacion>
                ]}
                data={prestacionesDisponibles}
                enableColumnActions={false}
                enableSorting={false}
                enableTopToolbar={false}
                enableBottomToolbar={false}
              />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700 }}>Prestaciones seleccionadas</Text>
            {prestacionesSeleccionadas.length === 0 ? (
              <Text color="dimmed">No hay prestaciones seleccionadas</Text>
            ) : (
              <MantineReactTable
                columns={[
                  { accessorKey: 'prestacion', header: 'Prestación' },
                  { accessorKey: 'cantidad', header: 'Cantidad', Cell: ({ cell, row }) => <NumberInput min={1} value={row.original.cantidad} onChange={(val) => actualizarPrestacionSeleccionada(row.original.id_servicio, { cantidad: (typeof val === 'number' ? val : Number(val) || 1) })} style={{ width: 90 }} /> },
                  { accessorKey: 'valor_asignado', header: 'Valor Asignado', Cell: ({ cell, row }) => <NumberInput min={0} step={0.01} value={row.original.valor_asignado} onChange={(val) => actualizarPrestacionSeleccionada(row.original.id_servicio, { valor_asignado: (typeof val === 'number' ? val : Number(val) || 0) })} style={{ width: 120 }} /> },
                  { id: 'subtotal', header: 'Subtotal', Cell: ({ row }) => formatCurrency(row.original.cantidad * row.original.valor_asignado) } as MRT_ColumnDef<any>,
                  { id: 'accion', header: '', Cell: ({ row }) => <Button color="red" size="xs" onClick={() => eliminarPrestacion(row.original.id_servicio)}>Eliminar</Button> } as MRT_ColumnDef<any>,
                ]}
                data={prestacionesSeleccionadas}
                enableColumnActions={false}
                enableSorting={false}
                enableTopToolbar={false}
                enableBottomToolbar={false}
              />
            )}
          </div>
        </Group>

        <Group style={{ justifyContent: 'flex-end' }} mt="md">
          <Button loading={guardando} disabled={guardando || !presupuestoId} onClick={guardarTodo}>Confirmar y Guardar Todo</Button>
        </Group>
      </Tabs.Panel>

      <Divider my="md" />
      <Group style={{ justifyContent: 'space-between' }}>
        <Text>Cliente: {nombre || '-'}</Text>
        <Text>Total Final: {formatCurrency(totalInsumos + totalPrestaciones)}</Text>
      </Group>
    </Tabs>
  );
}
