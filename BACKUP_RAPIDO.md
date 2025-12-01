# 🚀 Backup Rápido - Guía Express

## Para Llevar el Proyecto a Casa

### Opción 1: Usando el Script Automático (Windows)

1. **Doble click en**: `backup_database.bat`
2. Se creará automáticamente: `backup_mh_1_YYYYMMDD.sql`
3. **Copiar a USB/Drive**:
   - `backup_mh_1_YYYYMMDD.sql`
   - Todo el repositorio (o hacer `git pull` en casa)

### Opción 2: MySQL Workbench (Más Fácil)

1. Abrir **MySQL Workbench**
2. Conectar a la base de datos
3. **Server → Data Export**
4. Seleccionar schema: `mh_1`
5. **Export to Self-Contained File**
6. Guardar como: `backup_mh_1.sql`
7. Click **Start Export**

---

## En Casa - Setup Rápido

### 1. Importar Base de Datos

**MySQL Workbench**:
1. Abrir MySQL Workbench
2. Crear base de datos:
   ```sql
   CREATE DATABASE mh_1;
   ```
3. **Server → Data Import**
4. Seleccionar archivo `backup_mh_1.sql`
5. Target Schema: `mh_1`
6. Click **Start Import**

**Línea de Comandos**:
```bash
mysql -u root -p -e "CREATE DATABASE mh_1;"
mysql -u root -p mh_1 < backup_mh_1.sql
```

### 2. Configurar Variables de Entorno

**backend/.env**:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=mh_1
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=presupuestador_session_secret_2024_change_in_production
JWT_SECRET=presupuestador_jwt_secret_2024_change_in_production
```

**frontend/.env**:
```env
VITE_API_URL=http://localhost:4000
```

### 3. Instalar y Ejecutar

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

### 4. Abrir Navegador
```
http://localhost:5173
```

---

## ✅ Checklist Mínimo

- [ ] Backup de BD creado
- [ ] Repositorio actualizado (`git pull`)
- [ ] MySQL corriendo en casa
- [ ] BD importada
- [ ] `.env` creados (backend y frontend)
- [ ] `npm install` en ambos
- [ ] Todo funciona

---

## 🆘 Problemas Comunes

**"Cannot connect to database"**
→ Verificar credenciales en `backend/.env`

**"CORS error"**
→ Verificar `FRONTEND_URL` en `backend/.env`

**"Port already in use"**
→ Cambiar `PORT` en `backend/.env`

---

Para más detalles, ver: **SETUP_NUEVA_PC.md**
