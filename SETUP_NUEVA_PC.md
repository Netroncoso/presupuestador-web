# Guía de Setup en Nueva PC

## 📋 Requisitos Previos

- Node.js 18+ instalado
- MySQL 8.0+ instalado
- Git instalado
- Editor de código (VS Code recomendado)

---

## 🗄️ Paso 1: Exportar Base de Datos (PC Actual)

### Opción A: Usando MySQL Workbench (Recomendado)
1. Abrir MySQL Workbench
2. Conectar a la base de datos `mh_1`
3. Ir a **Server → Data Export**
4. Seleccionar schema: `mh_1`
5. Seleccionar **Export to Self-Contained File**
6. Guardar como: `backup_mh_1.sql`
7. Click en **Start Export**

### Opción B: Usando Línea de Comandos
```bash
# Buscar la ruta de MySQL (usualmente en C:\Program Files\MySQL\MySQL Server 8.0\bin)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Crear backup
mysqldump -u PRUEBAS -pMedihome2006 mh_1 > "C:\Users\ntroncoso\Desktop\presupuestador-web\backup_mh_1.sql"
```

### Opción C: Exportar solo estructura (sin datos)
```bash
mysqldump -u PRUEBAS -pMedihome2006 --no-data mh_1 > backup_estructura.sql
```

---

## 📦 Paso 2: Copiar Archivos a Nueva PC

### Archivos a Copiar

1. **Repositorio completo** (ya lo tenés clonado)
2. **Backup de base de datos**: `backup_mh_1.sql`
3. **Archivos de configuración** (crear manualmente en nueva PC):
   - `backend/.env`
   - `frontend/.env`

---

## 🏠 Paso 3: Setup en PC de Casa

### 3.1 Clonar Repositorio (si no lo hiciste)
```bash
git clone https://github.com/Netroncoso/presupuestador-web.git
cd presupuestador-web
```

### 3.2 Crear Base de Datos

#### Opción A: MySQL Workbench
1. Abrir MySQL Workbench
2. Conectar al servidor local
3. Crear nueva base de datos:
   ```sql
   CREATE DATABASE mh_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Ir a **Server → Data Import**
5. Seleccionar **Import from Self-Contained File**
6. Elegir archivo `backup_mh_1.sql`
7. Target Schema: `mh_1`
8. Click en **Start Import**

#### Opción B: Línea de Comandos
```bash
# Crear base de datos
mysql -u root -p -e "CREATE DATABASE mh_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importar backup
mysql -u root -p mh_1 < backup_mh_1.sql
```

### 3.3 Crear Usuario de Base de Datos (Opcional)
```sql
-- Conectar a MySQL como root
mysql -u root -p

-- Crear usuario
CREATE USER 'PRUEBAS'@'localhost' IDENTIFIED BY 'Medihome2006';

-- Dar permisos
GRANT ALL PRIVILEGES ON mh_1.* TO 'PRUEBAS'@'localhost';
FLUSH PRIVILEGES;
```

---

## ⚙️ Paso 4: Configurar Backend

### 4.1 Crear archivo `.env` en `backend/`

```bash
cd backend
```

Crear archivo `.env` con el siguiente contenido:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=PRUEBAS
DB_PASSWORD=Medihome2006
DB_NAME=mh_1

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URLs (ajustar según tu red local)
FRONTEND_URL=http://localhost:5173

# Security
SESSION_SECRET=presupuestador_session_secret_2024_change_in_production
JWT_SECRET=presupuestador_jwt_secret_2024_change_in_production
```

**IMPORTANTE**: Si usás usuario `root` de MySQL, cambiar:
```env
DB_USER=root
DB_PASSWORD=tu_password_root
```

### 4.2 Instalar Dependencias
```bash
npm install
```

### 4.3 Probar Conexión
```bash
npm run dev
```

Deberías ver:
```
Server running on port 4000
Database connected successfully
```

---

## 🎨 Paso 5: Configurar Frontend

### 5.1 Crear archivo `.env` en `frontend/`

```bash
cd ../frontend
```

Crear archivo `.env` con:

```env
VITE_API_URL=http://localhost:4000
```

**IMPORTANTE**: Si querés acceder desde otros dispositivos en tu red:
```env
VITE_API_URL=http://192.168.X.X:4000
```
(Reemplazar `192.168.X.X` con tu IP local)

### 5.2 Instalar Dependencias
```bash
npm install
```

### 5.3 Iniciar Frontend
```bash
npm run dev
```

Deberías ver:
```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## 🧪 Paso 6: Verificar Funcionamiento

### 6.1 Abrir Navegador
```
http://localhost:5173
```

### 6.2 Probar Login
- Usuario: (el que tengas en la BD)
- Password: (el que tengas en la BD)

### 6.3 Verificar Funcionalidades
- ✅ Login funciona
- ✅ Crear presupuesto
- ✅ Agregar insumos
- ✅ Agregar prestaciones
- ✅ Calcular totales
- ✅ Finalizar presupuesto
- ✅ Ver historial

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"
**Solución**:
1. Verificar que MySQL esté corriendo
2. Verificar credenciales en `backend/.env`
3. Verificar que la base de datos `mh_1` existe
4. Probar conexión manual:
   ```bash
   mysql -u PRUEBAS -pMedihome2006 mh_1
   ```

### Error: "CORS policy"
**Solución**:
1. Verificar que `FRONTEND_URL` en `backend/.env` incluya la URL del frontend
2. Si accedés desde otra PC en la red, agregar esa IP:
   ```env
   FRONTEND_URL=http://localhost:5173,http://192.168.X.X:5173
   ```

### Error: "Port 4000 already in use"
**Solución**:
1. Cambiar puerto en `backend/.env`:
   ```env
   PORT=3000
   ```
2. Actualizar `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

### Error: "Module not found"
**Solución**:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Base de Datos Vacía
**Solución**:
1. Verificar que el backup se importó correctamente
2. Ejecutar migraciones manualmente:
   ```bash
   mysql -u PRUEBAS -pMedihome2006 mh_1 < backend/migrations/create_prestador_servicio_valores.sql
   ```

---

## 📝 Configuraciones Actuales (PC Trabajo)

### Backend (.env)
```env
DB_HOST=127.0.0.1
DB_USER=PRUEBAS
DB_PASSWORD=Medihome2006
DB_NAME=mh_1
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173,http://localhost:5175,http://192.168.1.197:5173
SESSION_SECRET=presupuestador_session_secret_2024_change_in_production
JWT_SECRET=presupuestador_jwt_secret_2024_change_in_production
```

### Frontend (.env)
```env
VITE_API_URL=http://192.168.1.197:4000
```

**Nota**: En casa, cambiar a `http://localhost:4000` o tu IP local

---

## 🚀 Scripts Útiles

### Iniciar Todo (Desarrollo)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Backup Rápido de BD
```bash
mysqldump -u PRUEBAS -pMedihome2006 mh_1 > backup_$(date +%Y%m%d).sql
```

### Restaurar Backup
```bash
mysql -u PRUEBAS -pMedihome2006 mh_1 < backup_20241228.sql
```

---

## 📊 Estructura de Archivos Importantes

```
presupuestador-web/
├── backend/
│   ├── .env                    # ⚠️ NO COMMITEAR - Crear manualmente
│   ├── src/
│   ├── migrations/             # Scripts SQL de migraciones
│   └── package.json
├── frontend/
│   ├── .env                    # ⚠️ NO COMMITEAR - Crear manualmente
│   ├── src/
│   └── package.json
├── backup_mh_1.sql            # ⚠️ NO COMMITEAR - Backup de BD
├── README.md
└── SETUP_NUEVA_PC.md          # 📄 Esta guía
```

---

## 🔐 Seguridad

### Archivos que NO deben estar en Git
- ✅ `.env` (backend y frontend) - Ya están en `.gitignore`
- ✅ `backup_*.sql` - Agregar a `.gitignore`
- ✅ `node_modules/` - Ya están en `.gitignore`

### Verificar .gitignore
```bash
# Verificar que .env no se suba
git status

# Si aparece .env, agregarlo a .gitignore
echo ".env" >> .gitignore
echo "backup_*.sql" >> .gitignore
```

---

## 📞 Checklist Final

Antes de trabajar en casa, verificar:

- [ ] Backup de BD creado y copiado
- [ ] Repositorio actualizado (`git pull`)
- [ ] MySQL instalado y corriendo
- [ ] Node.js instalado
- [ ] Base de datos `mh_1` creada e importada
- [ ] `backend/.env` creado con credenciales correctas
- [ ] `frontend/.env` creado con URL correcta
- [ ] `npm install` ejecutado en backend y frontend
- [ ] Backend inicia sin errores (`npm run dev`)
- [ ] Frontend inicia sin errores (`npm run dev`)
- [ ] Login funciona correctamente
- [ ] Crear presupuesto de prueba funciona

---

## 🆘 Contacto

Si tenés problemas, revisar:
1. Logs de backend (terminal donde corre `npm run dev`)
2. Consola del navegador (F12)
3. Verificar que todos los servicios estén corriendo

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.0
