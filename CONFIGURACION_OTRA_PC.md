# Configuración para Otra PC

## 📋 REQUISITOS PREVIOS

### Software Necesario
1. **Node.js 18+** - https://nodejs.org/
2. **MySQL 8.0+** - https://dev.mysql.com/downloads/mysql/
3. **Git** - https://git-scm.com/downloads

---

## 🔐 CREDENCIALES DE ESTA PC

### MySQL
- **Host:** localhost
- **Puerto:** 3306
- **Usuario:** root
- **Base de datos:** mh_1
- **Contraseña:** [La que usas en MySQL Workbench]

### Backend (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=[TU_PASSWORD_MYSQL]
DB_NAME=mh_1
PORT=3000
JWT_SECRET=tu_secret_key_aqui
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

---

## 📦 PASO 1: VERIFICAR EL BACKUP

### Verificar que el backup es válido

```bash
# Ver primeras líneas del backup
head -n 50 backup_mh_1.sql

# Buscar CREATE TABLE (debe haber varias)
findstr /C:"CREATE TABLE" backup_mh_1.sql

# Buscar INSERT INTO (debe haber datos)
findstr /C:"INSERT INTO" backup_mh_1.sql
```

### Verificar estructura esperada

El backup debe contener:
- ✅ CREATE TABLE para todas las tablas
- ✅ INSERT INTO con datos
- ✅ Foreign Keys (CONSTRAINT)
- ✅ Índices (CREATE INDEX)

---

## 🚀 PASO 2: RESTAURAR EN OTRA PC

### 2.1 Instalar MySQL

1. Descargar MySQL 8.0+ desde https://dev.mysql.com/downloads/mysql/
2. Durante instalación, configurar:
   - Usuario: `root`
   - Contraseña: [elegir una segura]
   - Puerto: `3306`

### 2.2 Crear Base de Datos

```sql
-- Abrir MySQL Workbench o CMD
mysql -u root -p

-- Crear base de datos
CREATE DATABASE mh_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Salir
exit;
```

### 2.3 Restaurar Backup

⚠️ **IMPORTANTE:** La base de datos ya tiene aplicada la migración `Sucursal → sucursal_id`.  
Si restauras desde un backup antiguo (antes de Dic 2024), necesitarás aplicar migraciones.

```bash
# Opción 1: Desde CMD/PowerShell
cd C:\ruta\donde\esta\el\backup
mysql -u root -p mh_1 < backup_mh_1.sql

# Opción 2: Desde MySQL Workbench
# Server → Data Import → Import from Self-Contained File
# Seleccionar: backup_mh_1.sql
# Target Schema: mh_1
# Start Import
```

### 2.3.1 Aplicar Migraciones (si es backup antiguo)

```bash
# Solo si el backup NO tiene sucursal_id
cd presupuestador-web\backend\migrations

# 1. Cambios de tipos de datos y FKs
mysql -u root -p mh_1 < cambios_seguros.sql

# 2. Sistema de valores históricos
mysql -u root -p mh_1 < create_prestador_servicio_valores.sql

# 3. Campos adicionales
mysql -u root -p mh_1 < add_precio_facturar_to_presupuesto_insumos.sql
mysql -u root -p mh_1 < add_valor_facturar_to_presupuesto_prestaciones.sql
mysql -u root -p mh_1 < add_sucursal_to_usuarios.sql
```

### 2.4 Verificar Restauración

```sql
-- Conectar a la base
USE mh_1;

-- Ver tablas
SHOW TABLES;

-- Verificar datos
SELECT COUNT(*) FROM presupuestos;
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM insumos;

-- ✅ VERIFICAR MIGRACIÓN APLICADA
-- Debe mostrar sucursal_id (INT) y NO Sucursal (VARCHAR)
DESCRIBE presupuestos;

-- Verificar FK de sucursal_id
SHOW CREATE TABLE presupuestos;
-- Debe incluir: CONSTRAINT `fk_presupuestos_sucursal` FOREIGN KEY (`sucursal_id`)

-- Verificar tipos de datos corregidos
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'presupuestos' 
  AND COLUMN_NAME IN ('DNI', 'total_insumos', 'costo_total', 'sucursal_id');
-- DNI: varchar(20) ✅
-- total_insumos: decimal(10,2) ✅
-- costo_total: decimal(10,2) ✅
-- sucursal_id: int ✅

-- Verificar todas las FKs
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'mh_1'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 💻 PASO 3: CONFIGURAR APLICACIÓN

### 3.1 Clonar Repositorio

```bash
# Clonar desde GitHub
git clone https://github.com/Netroncoso/presupuestador-web.git
cd presupuestador-web

# Cambiar a rama dev-experimental (si es necesario)
git checkout dev-experimental
```

### 3.2 Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
copy .env.example .env

# Editar .env con tus credenciales
notepad .env
```

**Contenido de backend/.env:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL_AQUI
DB_NAME=mh_1
PORT=3000
JWT_SECRET=mi_clave_secreta_super_segura_123
```

### 3.3 Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo .env
copy .env.example .env

# Editar .env
notepad .env
```

**Contenido de frontend/.env:**
```env
VITE_API_URL=http://localhost:3000
```

---

## ▶️ PASO 4: EJECUTAR APLICACIÓN

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Debe mostrar:
```
Server running on port 3000
Database connected successfully
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Debe mostrar:
```
Local: http://localhost:5173/
```

### Abrir en navegador
```
http://localhost:5173
```

---

## ✅ VERIFICACIÓN FINAL

### Checklist de Funcionamiento

- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] Login funciona
- [ ] Crear presupuesto funciona
- [ ] Ver lista de presupuestos funciona
- [ ] Agregar insumos/prestaciones funciona

### Usuarios de Prueba

Verificar que existen usuarios en la BD:
```sql
SELECT id, username, rol FROM usuarios;
```

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot connect to database"
```bash
# Verificar que MySQL está corriendo
# Windows: Services → MySQL80 → Start

# Verificar credenciales en .env
# Verificar que la base de datos existe
mysql -u root -p -e "SHOW DATABASES;"
```

### Error: "Port 3000 already in use"
```bash
# Cambiar puerto en backend/.env
PORT=3001

# Y en frontend/.env
VITE_API_URL=http://localhost:3001
```

### Error: "CORS policy"
```bash
# Verificar que backend/src/app.ts tiene:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## 📝 NOTAS IMPORTANTES

1. **Backup Regular:** Hacer backup semanal
   ```bash
   mysqldump -u root -p mh_1 > backup_mh_1_YYYY-MM-DD.sql
   ```

2. **Seguridad:**
   - Cambiar JWT_SECRET en producción
   - Usar contraseñas fuertes para MySQL
   - No subir archivos .env a GitHub

3. **Actualizaciones:**
   ```bash
   git pull origin dev-experimental
   cd backend && npm install
   cd ../frontend && npm install
   ```

---

## 📞 CONTACTO

Si hay problemas durante la instalación, verificar:
1. Logs del backend (terminal)
2. Logs del frontend (consola del navegador F12)
3. Logs de MySQL (MySQL Workbench)
