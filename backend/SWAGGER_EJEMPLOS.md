# Ejemplos de Documentación Swagger

## Cómo documentar endpoints

Agrega comentarios JSDoc antes de cada ruta. Aquí tienes ejemplos:

### Ejemplo 1: GET simple

```typescript
/**
 * @swagger
 * /api/equipamientos:
 *   get:
 *     summary: Obtener todos los equipamientos activos
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipamientos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   precio_referencia:
 *                     type: number
 */
router.get('/', authenticateToken, equipamientosController.getEquipamientos);
```

### Ejemplo 2: POST con body

```typescript
/**
 * @swagger
 * /api/equipamientos/admin:
 *   post:
 *     summary: Crear nuevo equipamiento
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *               - precio_referencia
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Cama Articulada"
 *               tipo:
 *                 type: string
 *                 example: "mobiliario"
 *               precio_referencia:
 *                 type: number
 *                 example: 15000.00
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Equipamiento creado exitosamente
 */
router.post('/admin', authenticateToken, requireAdmin, equipamientosController.crearEquipamiento);
```

### Ejemplo 3: GET con parámetros

```typescript
/**
 * @swagger
 * /api/equipamientos/financiador/{id}:
 *   get:
 *     summary: Obtener equipamientos por financiador
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del financiador
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para valores vigentes (YYYY-MM-DD)
 *       - in: query
 *         name: sucursal_id
 *         schema:
 *           type: integer
 *         description: ID de la sucursal
 *     responses:
 *       200:
 *         description: Lista de equipamientos con valores vigentes
 */
router.get('/financiador/:id', authenticateToken, equipamientosController.getEquipamientosPorFinanciador);
```

### Ejemplo 4: PUT/DELETE

```typescript
/**
 * @swagger
 * /api/equipamientos/admin/{id}:
 *   put:
 *     summary: Actualizar equipamiento
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *               precio_referencia:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Equipamiento actualizado
 *   delete:
 *     summary: Eliminar equipamiento
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Equipamiento eliminado
 */
router.put('/admin/:id', authenticateToken, requireAdmin, equipamientosController.actualizarEquipamiento);
router.delete('/admin/:id', authenticateToken, requireAdmin, equipamientosController.eliminarEquipamiento);
```

## Tags disponibles

Organiza tus endpoints por categorías:

- Auth
- Presupuestos
- Insumos
- Prestaciones
- Equipamientos
- Financiadores
- Sucursales
- Auditoría
- Notificaciones
- Reportes
- Admin

## Acceder a la documentación

Una vez iniciado el servidor:

```
http://localhost:3000/api-docs
```

## Notas

- Solo necesitas documentar las rutas principales
- Swagger genera automáticamente la UI interactiva
- Puedes probar los endpoints directamente desde la UI
- El token JWT se configura una vez y se usa en todas las peticiones
