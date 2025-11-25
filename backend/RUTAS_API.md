# 📋 Rutas API - Presupuestador Web

## 🔐 Autenticación
Todas las rutas requieren autenticación mediante token JWT en el header `Authorization: Bearer <token>`

---

## 📊 PRESUPUESTOS

### Rutas Generales

#### Listar Presupuestos
```http
GET /api/presupuestos
Query params:
  - limit: number (default: 100)
  - offset: number (default: 0)
  - estado: 'borrador' | 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado'
```

#### Crear Presupuesto
```http
POST /api/presupuestos
Body: {
  nombre: string,
  dni: string,
  sucursal: string,
  dificil_acceso: 'si' | 'no'
}
Response: { id: number, version: number }
```

---

### Verificación DNI

#### Verificar DNI (Ruta 1)
```http
GET /api/presupuestos/dni/:dni
```

#### Verificar DNI (Ruta 2 - Alias)
```http
GET /api/presupuestos/verificar-dni/:dni
Response: { exists: boolean, presupuesto?: {...} }
```

---

### Consultas de Presupuesto

#### Obtener Presupuesto
```http
GET /api/presupuestos/:id
Response: {
  ...presupuesto,
  prestaciones: [...],
  insumos: [...],
  financiador: {...}
}
```

#### Obtener Historial de Versiones
```http
GET /api/presupuestos/:id/versiones
Response: [
  {
    idPresupuestos: number,
    version: number,
    estado: string,
    totales: {...},
    created_at: date,
    usuario_creador: string
  }
]
```

---

### Acciones sobre Presupuesto

#### Finalizar Presupuesto
```http
POST /api/presupuestos/:id/finalizar
Body: {
  totales?: {
    totalInsumos: number,
    totalPrestaciones: number,
    costoTotal: number,
    totalFacturar: number,
    rentabilidad: number,
    rentabilidadConPlazo: number
  }
}
Response: {
  success: boolean,
  estado: string,
  totales: {...},
  mensaje: string
}
```
**Nota:** Los totales se calculan automáticamente desde la BD. El body es opcional.

#### Crear Versión para Edición
```http
POST /api/presupuestos/:id/version/editar
Response: {
  id: number,
  version: number,
  estado: 'borrador'
}
```
**Nota:** Crea una nueva versión copiando insumos y prestaciones del original.

---

### Actualizaciones

#### Actualizar Prestador/Financiador
```http
PUT /api/presupuestos/:id/prestador
Body: { idobra_social: string }
```

#### Cambiar Estado (Solo Auditor/Admin)
```http
PUT /api/presupuestos/:id/estado
Body: {
  estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado',
  comentario?: string
}
```

---

## 🔍 AUDITORÍA

### Obtener Presupuestos Pendientes (Solo Auditor/Admin)
```http
GET /api/presupuestos/auditor/pendientes
Response: [
  {
    idPresupuestos: number,
    version: number,
    estado: string,
    Nombre_Apellido: string,
    DNI: string,
    costo_total: number,
    rentabilidad: number,
    dias_pendiente: number,
    creador: string
  }
]
```

---

## 📦 INSUMOS Y PRESTACIONES

### Insumos
```http
GET    /api/presupuestos/:id/insumos
POST   /api/presupuestos/:id/insumos
DELETE /api/presupuestos/:id/insumos
```

### Prestaciones
```http
GET    /api/presupuestos/:id/prestaciones
POST   /api/presupuestos/:id/prestaciones
DELETE /api/presupuestos/:id/prestaciones
```

---

## 🔔 NOTIFICACIONES

```http
GET /api/notificaciones
GET /api/notificaciones/count
PUT /api/notificaciones/:id/leer
PUT /api/notificaciones/leer-todas
```

---

## 🛡️ AUDITORÍA (Rutas Adicionales)

```http
GET /api/auditoria/pendientes
PUT /api/auditoria/pedir/:id
PUT /api/auditoria/estado/:id
```

---

## 📝 REGLAS AUTOMÁTICAS

Un presupuesto va a auditoría automáticamente si cumple alguna de estas condiciones:

1. **Rentabilidad < 15%**
2. **Costo total > $150,000**
3. **Difícil acceso = 'SI'**
4. **Rentabilidad con plazo > 25%**

---

## 🔄 FLUJO TÍPICO

### Crear Presupuesto Nuevo
```
1. POST /presupuestos (crear)
2. POST /presupuestos/:id/insumos (agregar insumos)
3. POST /presupuestos/:id/prestaciones (agregar prestaciones)
4. PUT  /presupuestos/:id/prestador (asignar financiador)
5. POST /presupuestos/:id/finalizar (finalizar y evaluar)
```

### Editar Presupuesto Existente
```
1. POST /presupuestos/:id/version/editar (crear nueva versión)
2. Modificar insumos/prestaciones de la nueva versión
3. POST /presupuestos/:id/finalizar (finalizar nueva versión)
```

### Auditoría
```
1. GET  /presupuestos/auditor/pendientes (ver pendientes)
2. GET  /presupuestos/:id (ver detalle)
3. PUT  /presupuestos/:id/estado (aprobar/rechazar)
```

---

## ⚠️ NOTAS IMPORTANTES

- **Totales:** Se calculan automáticamente desde la BD al finalizar
- **Versiones:** Solo la última versión tiene `es_ultima_version = 1`
- **Estados:** Solo presupuestos en 'borrador' pueden finalizarse
- **Permisos:** Algunas rutas requieren rol específico (auditor/admin)
- **Transacciones:** Operaciones críticas usan transacciones para garantizar consistencia

---

## 🗑️ RUTAS ELIMINADAS (Deprecated)

Las siguientes rutas fueron eliminadas por ser redundantes:

- ~~`POST /presupuestos/:id/guardar-version`~~ → Usar `/presupuestos/:id/finalizar`
- ~~`GET /presupuestos/:id/historial`~~ → Usar `/presupuestos/:id/versiones`
- ~~`POST /presupuestos/:id/editar`~~ → Usar `/presupuestos/:id/version/editar`

---

**Última actualización:** $(date)
**Versión API:** 2.0
