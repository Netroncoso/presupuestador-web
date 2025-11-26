import React, { useState } from 'react';
import { Modal, Text, Button, Group, Stack, Loader, Table } from '@mantine/core';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

const ICON_SIZE = { width: 20, height: 20 };

interface ItemFaltante {
  tipo: 'insumo' | 'prestacion';
  nombre: string;
  cantidad: number;
  datos: any;
  accion: 'guardar' | 'eliminar';
}

interface ModalValidacionItemsProps {
  opened: boolean;
  onClose: () => void;
  itemsFaltantes: ItemFaltante[];
  onReintentarItem: (item: ItemFaltante) => Promise<boolean>;
  onContinuarDeTodasFormas: () => void;
  onFinalizarPresupuesto: () => void;
}

export const ModalValidacionItems: React.FC<ModalValidacionItemsProps> = ({
  opened,
  onClose,
  itemsFaltantes,
  onReintentarItem,
  onContinuarDeTodasFormas,
  onFinalizarPresupuesto
}) => {
  const [reintentando, setReintentando] = useState<Set<string>>(new Set());
  const [exitosos, setExitosos] = useState<Set<string>>(new Set());
  const [fallidos, setFallidos] = useState<Set<string>>(new Set());

  const handleReintentarItem = async (item: ItemFaltante, index: number) => {
    const key = `${item.tipo}-${index}`;
    setReintentando(prev => new Set(prev).add(key));
    
    try {
      const exito = await onReintentarItem(item);
      
      if (exito) {
        setExitosos(prev => new Set(prev).add(key));
        setFallidos(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        setFallidos(prev => new Set(prev).add(key));
      }
    } catch (error) {
      setFallidos(prev => new Set(prev).add(key));
    } finally {
      setReintentando(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleReintentarTodos = async () => {
    for (let i = 0; i < itemsFaltantes.length; i++) {
      const key = `${itemsFaltantes[i].tipo}-${i}`;
      if (!exitosos.has(key)) {
        await handleReintentarItem(itemsFaltantes[i], i);
      }
    }
  };

  const todosExitosos = itemsFaltantes.every((_, i) => 
    exitosos.has(`${itemsFaltantes[i].tipo}-${i}`)
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Items No Guardados"
      size="lg"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Se detectaron diferencias entre el frontend y la base de datos.
          Revisa los items y decide qué hacer con cada uno.
        </Text>

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Item</Table.Th>
              <Table.Th>Cantidad</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {itemsFaltantes.map((item, index) => {
              const key = `${item.tipo}-${index}`;
              const estaReintentando = reintentando.has(key);
              const esExitoso = exitosos.has(key);
              const esFallido = fallidos.has(key);

              return (
                <Table.Tr key={key}>
                  <Table.Td>
                    <Text size="sm">
                      {item.tipo === 'insumo' ? 'Insumo' : 'Prestación'}
                    </Text>
                  </Table.Td>
                  <Table.Td>{item.nombre}</Table.Td>
                  <Table.Td>{item.cantidad}</Table.Td>
                  <Table.Td>
                    {estaReintentando && <Loader size="xs" />}
                    {esExitoso && (
                      <Group gap="xs">
                        <CheckCircleIcon style={{ width: 16, height: 16, color: 'green' }} />
                        <Text size="sm">Guardado</Text>
                      </Group>
                    )}
                    {esFallido && !estaReintentando && (
                      <Group gap="xs">
                        <XCircleIcon style={{ width: 16, height: 16, color: 'red' }} />
                        <Text size="sm">Falló</Text>
                      </Group>
                    )}
                    {!estaReintentando && !esExitoso && !esFallido && (
                      <Text size="sm">Pendiente</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {!esExitoso && (
                      <Button
                        size="xs"
                        variant="light"
                        color={item.accion === 'eliminar' ? 'red' : 'blue'}
                        onClick={() => handleReintentarItem(item, index)}
                        loading={estaReintentando}
                        leftSection={item.accion === 'eliminar' ? <TrashIcon style={ICON_SIZE} /> : <ArrowPathIcon style={ICON_SIZE} />}
                      >
                        {item.accion === 'eliminar' ? 'Eliminar' : 'Guardar'}
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>

        {todosExitosos && (
          <Text size="sm" fw={500} c="green" ta="center">
            Todos los items se guardaron correctamente
          </Text>
        )}

        <Group justify="space-between" mt="md">
          <Button
            variant="outline"
            color="blue"
            size="sm"
            onClick={handleReintentarTodos}
            disabled={todosExitosos}
            leftSection={<ArrowPathIcon style={ICON_SIZE} />}
          >
            Procesar Todos
          </Button>
          <Group gap="md">
            <Button 
              variant="outline" 
              color="gray"
              size="sm"
              onClick={onClose}
            >
              Cancelar
            </Button>
            {todosExitosos ? (
              <Button 
                color="green" 
                size="sm"
                onClick={onFinalizarPresupuesto}
                leftSection={<CheckCircleIcon style={ICON_SIZE} />}
              >
                Finalizar Presupuesto
              </Button>
            ) : (
              <Button 
                color="orange" 
                size="sm"
                onClick={onContinuarDeTodasFormas}
              >
                Continuar Sin Ellos
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
