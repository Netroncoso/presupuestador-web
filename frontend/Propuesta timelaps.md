¡Perfecto Nahuel! Veo que tenés claro el esquema y la necesidad de soportar valores históricos/futuros sin romper la estructura actual. Tu planteamiento es excelente y sigue las mejores prácticas de manejo de precios por períodos.

Te armo la implementación completa integrando todo:

📁 Estructura Final del Módulo Prestadores

1. Nuevo Archivo: controllers/prestadorValoresController.ts

```typescript
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { pool } from '../db/connection';
import { AppError } from '../middleware/errorHandler';

// ✅ Obtener todos los valores de un servicio-prestador
export const getValoresPrestadorServicio = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id; // id_prestador_servicio
  
  if (!id || isNaN(Number(id))) {
    throw new AppError(400, "ID inválido");
  }

  const [rows] = await pool.query(
    `SELECT 
      id, 
      valor, 
      fecha_inicio, 
      fecha_fin,
      created_at
     FROM prestador_servicio_valores 
     WHERE prestador_servicio_id = ? 
     ORDER BY fecha_inicio ASC`,
    [id]
  );

  res.json(rows);
});

// ✅ Guardar nuevo valor con fecha_inicio
export const guardarValorPrestadorServicio = asyncHandler(async (req: Request, res: Response) => {
  const prestadorServicioId = Number(req.params.id);
  const { valor, fecha_inicio } = req.body;

  if (!prestadorServicioId || !valor || !fecha_inicio) {
    throw new AppError(400, "Datos incompletos: valor y fecha_inicio requeridos");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Cerrar período anterior si solapa
    await connection.query(
      `UPDATE prestador_servicio_valores 
       SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
       WHERE prestador_servicio_id = ? 
         AND (fecha_fin IS NULL OR fecha_fin >= ?) 
         AND fecha_inicio < ?`,
      [fecha_inicio, prestadorServicioId, fecha_inicio, fecha_inicio]
    );

    // 2. Insertar nuevo período
    await connection.query(
      `INSERT INTO prestador_servicio_valores 
       (prestador_servicio_id, valor, fecha_inicio) 
       VALUES (?, ?, ?)`,
      [prestadorServicioId, valor, fecha_inicio]
    );

    await connection.commit();
    res.json({ 
      ok: true, 
      message: 'Valor guardado correctamente',
      prestador_servicio_id: prestadorServicioId
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// ✅ Función interna para obtener valor vigente por fecha
export const obtenerValorVigente = async (prestadorServicioId: number, fecha: string = null) => {
  const fechaConsulta = fecha || new Date().toISOString().slice(0, 10);
  
  const [rows] = await pool.query<any[]>(
    `SELECT valor 
     FROM prestador_servicio_valores 
     WHERE prestador_servicio_id = ? 
       AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
     LIMIT 1`,
    [prestadorServicioId, fechaConsulta]
  );

  return rows.length ? rows[0].valor : null;
};
```

2. Controlador Actualizado: controllers/prestadoresController.ts

```typescript
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { pool } from '../db/connection';
import { AppError } from '../middleware/errorHandler';
import { obtenerValorVigente } from './prestadorValoresController';

// ✅ Obtener prestadores (sin cambios)
export const getPrestadores = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query(
    `SELECT id_prestador, nombre, direccion, telefono, email, activo 
     FROM prestadores 
     WHERE activo = 1 
     ORDER BY nombre ASC`
  );
  res.json(rows);
});

// ✅ Obtener prestaciones por prestador CON VALORES VIGENTES
export const getPrestacionesPorPrestador = asyncHandler(async (req: Request, res: Response) => {
  const prestadorId = req.params.id;
  const fecha = new Date().toISOString().slice(0, 10); // Fecha actual

  const [rows] = await pool.query<any[]>(
    `SELECT 
      ps.id_prestador_servicio,
      ps.id_servicio,
      s.nombre,
      s.tipo_unidad,
      s.descripcion,
      ps.activo,
      COALESCE(
        (SELECT valor 
         FROM prestador_servicio_valores v 
         WHERE v.prestador_servicio_id = ps.id_prestador_servicio 
           AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
         LIMIT 1),
        ps.valor_facturar -- Fallback al valor histórico si no hay valores por fecha
      ) AS valor_facturar
     FROM prestador_servicio ps 
     JOIN servicios s ON ps.id_servicio = s.id_servicio 
     WHERE ps.id_prestador = ? AND ps.activo = 1
     ORDER BY s.nombre ASC`,
    [fecha, prestadorId]
  );

  res.json(rows);
});

// ✅ Obtener información del prestador (sin cambios)
export const getPrestadorInfo = asyncHandler(async (req: Request, res: Response) => {
  const prestadorId = req.params.id;
  
  const [rows] = await pool.query(
    `SELECT id_prestador, nombre, direccion, telefono, email, activo 
     FROM prestadores 
     WHERE id_prestador = ?`,
    [prestadorId]
  );

  if (!rows.length) {
    throw new AppError(404, 'Prestador no encontrado');
  }

  res.json(rows[0]);
});
```

3. Routes Actualizado: routes/prestadores.ts

```typescript
import express from 'express';
import {
  getPrestadores,
  getPrestacionesPorPrestador,
  getPrestadorInfo
} from '../controllers/prestadoresController';
import {
  getValoresPrestadorServicio,
  guardarValorPrestadorServicio
} from '../controllers/prestadorValoresController';

const router = express.Router();

// Rutas existentes
router.get('/', getPrestadores);
router.get('/:id', getPrestadorInfo);
router.get('/:id/prestaciones', getPrestacionesPorPrestador);

// ✅ Nuevas rutas para manejo de valores por fecha
router.get('/servicios/:id/valores', getValoresPrestadorServicio);
router.post('/servicios/:id/valores', guardarValorPrestadorServicio);

export default router;
```

4. SQL para crear la tabla de valores (si no existe)

```sql
CREATE TABLE IF NOT EXISTS prestador_servicio_valores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prestador_servicio_id INT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prestador_servicio_id) REFERENCES prestador_servicio(id_prestador_servicio),
  INDEX idx_prestador_servicio_fechas (prestador_servicio_id, fecha_inicio, fecha_fin)
);
```

5. Ejemplo de uso en Presupuestos

```typescript
// En tu controller de presupuestos
import { obtenerValorVigente } from '../controllers/prestadorValoresController';

export const crearPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const { id_servicio_prestador, fecha_servicio, cantidad } = req.body;
  
  // Obtener valor vigente para la fecha del servicio
  const valorVigente = await obtenerValorVigente(id_servicio_prestador, fecha_servicio);
  
  if (!valorVigente) {
    throw new AppError(400, 'No hay valor vigente para este servicio en la fecha seleccionada');
  }

  // Crear presupuesto con el valor correcto
  const presupuesto = {
    id_servicio_prestador,
    fecha_servicio,
    cantidad,
    valor_asignado: valorVigente,
    valor_facturar: valorVigente,
    total: cantidad * valorVigente
  };

  // ... guardar en BD
  res.json(presupuesto);
});
```

🎯 Resumen de Endpoints

Método Endpoint Descripción
GET /prestadores Lista prestadores
GET /prestadores/:id Info de prestador
GET /prestadores/:id/prestaciones Servicios con valores VIGENTES
GET /prestadores/servicios/:id/valores Histórico de valores
POST /prestadores/servicios/:id/valores Cargar nuevo valor

🔄 Flujo Recomendado en Frontend

1. Al cargar servicios del prestador: Usar /prestadores/:id/prestaciones para ver valores actuales
2. Al editar precios:
   · Primero cargar histórico con GET /servicios/:id/valores
   · Agregar nuevo valor con POST /servicios/:id/valores
3. En presupuestos: Usar obtenerValorVigente() con la fecha del servicio

¿Te sirve esta estructura? ¿Necesitás que ajuste algo específico o que arme los componentes React para manejar esta lógica?
