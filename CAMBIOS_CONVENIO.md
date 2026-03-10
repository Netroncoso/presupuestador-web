# Cambios necesarios en ServiciosPorFinanciador.tsx

## Cambios a realizar:

1. Cambiar interfaz `Sucursal` por `Zona`:
```typescript
interface Zona {
  id: number;
  nombre: string;
  activo: number;
}
```

2. Cambiar estado `sucursales` por `zonas`:
```typescript
const [zonas, setZonas] = useState<Zona[]>([]);
```

3. Cambiar `nuevosValores` para usar `zona_id` y eliminar `valor_asignado`:
```typescript
const [nuevosValores, setNuevosValores] = useState<Array<{
  valor_facturar: string;
  fecha_inicio: string;
  zona_id: string;
}>>([{
  valor_facturar: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  zona_id: ''
}]);
```

4. Cambiar función `cargarSucursales` por `cargarZonas`:
```typescript
const cargarZonas = async () => {
  try {
    const response = await api.get('/tarifario/zonas');
    setZonas(response.data.filter((z: Zona) => z.activo === 1));
  } catch (error) {
    console.error('Error al cargar zonas:', error);
  }
};
```

5. En el formulario, cambiar Select de "Sucursal" a "Zona" y eliminar campo "Valor Sugerido"

6. En validación, cambiar a: `v.valor_facturar && v.fecha_inicio && v.zona_id`

7. En POST, enviar: `precio_facturar`, `fecha_inicio`, `zona_id` (sin `valor_asignado`)

## Backend también necesita actualización en:
- `/prestaciones/servicio/:id/valores` endpoint
- Debe aceptar `zona_id` y `precio_facturar` (sin `valor_asignado`, `sucursal_id`)
