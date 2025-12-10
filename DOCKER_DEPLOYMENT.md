# 🐳 Deployment con Docker - Producción en Red Local

## 📋 Requisitos Previos

- PC/Servidor con Windows 10/11 o Linux Ubuntu 20.04+
- Mínimo 4GB RAM, 50GB disco disponible
- Red local configurada (router/switch)
- Acceso administrativo al servidor

---

## 🚀 Instalación Rápida (5 minutos)

### **Paso 1: Instalar Docker**

#### Windows
```powershell
# Descargar e instalar Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Reiniciar PC después de la instalación

# Verificar instalación
docker --version
docker compose version
```

#### Linux (Ubuntu)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalación
docker --version
docker compose version
```

---

### **Paso 2: Obtener IP del Servidor**

```bash
# Windows
ipconfig
# Buscar "Dirección IPv4": ejemplo 192.168.1.100

# Linux
ip addr show
# Buscar "inet": ejemplo 192.168.1.100
```

**Anotar esta IP, la necesitarás en el Paso 4**

---

### **Paso 3: Copiar Proyecto al Servidor**

```bash
# Opción A: Copiar carpeta completa por USB/Red compartida
# Copiar a: C:\presupuestador-web (Windows)
#          /home/usuario/presupuestador-web (Linux)

# Opción B: Clonar desde Git (si tienes repositorio)
git clone https://github.com/tu-usuario/presupuestador-web.git
cd presupuestador-web
```

---

### **Paso 4: Configurar Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto:

```env
# MySQL
MYSQL_ROOT_PASSWORD=root_password_super_seguro_cambiar
MYSQL_DATABASE=mh_1
MYSQL_USER=presupuestador
MYSQL_PASSWORD=password_seguro_cambiar_123

# Backend
DB_HOST=mysql
DB_USER=presupuestador
DB_PASSWORD=password_seguro_cambiar_123
DB_NAME=mh_1
PORT=3000
JWT_SECRET=jwt_secret_super_seguro_cambiar_minimo_32_caracteres
NODE_ENV=production

# Frontend (⚠️ CAMBIAR 192.168.1.100 POR LA IP DE TU SERVIDOR)
VITE_API_URL=http://192.168.1.100:3000
```

---

### **Paso 5: Iniciar Aplicación**

```bash
# Navegar a la carpeta del proyecto
cd presupuestador-web

# Construir e iniciar todos los servicios
docker compose up -d --build

# Ver logs (Ctrl+C para salir)
docker compose logs -f

# Verificar que todo está corriendo
docker compose ps
```

**Salida esperada:**
```
NAME                          STATUS    PORTS
presupuestador-backend        Up        0.0.0.0:3000->3000/tcp
presupuestador-frontend       Up        0.0.0.0:80->80/tcp
presupuestador-mysql          Up        0.0.0.0:3306->3306/tcp
```

---

### **Paso 6: Importar Base de Datos (Primera vez)**

```bash
# Si tienes un backup de la base de datos
docker compose exec -T mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backup.sql

# O ejecutar migraciones manualmente
docker compose exec mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backend/migrations/create_prestador_servicio_valores.sql
docker compose exec mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backend/migrations/add_sucursal_to_valores.sql
docker compose exec mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backend/migrations/add_performance_indexes.sql
```

---

### **Paso 7: Acceder a la Aplicación**

**Desde el servidor:**
```
http://localhost
```

**Desde cualquier PC en la red local:**
```
http://192.168.1.100
```
*(Reemplazar con la IP de tu servidor)*

---

## 📁 Archivos de Configuración Docker

### **docker-compose.yml** (raíz del proyecto)

```yaml
version: '3.8'

services:
  # Base de datos MySQL
  mysql:
    image: mysql:8.0
    container_name: presupuestador-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backups:/backups
    networks:
      - presupuestador-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: presupuestador-backend
    restart: always
    environment:
      DB_HOST: ${DB_HOST}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      PORT: ${PORT}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: ${NODE_ENV}
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - presupuestador-network

  # Frontend Web
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
    container_name: presupuestador-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - presupuestador-network

volumes:
  mysql_data:
    driver: local

networks:
  presupuestador-network:
    driver: bridge
```

---

### **backend/Dockerfile**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

---

### **frontend/Dockerfile**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### **frontend/nginx.conf**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

### **backend/.dockerignore**

```
node_modules
dist
.env
.env.*
*.log
.git
.gitignore
README.md
*.md
.vscode
.idea
coverage
.DS_Store
```

---

### **frontend/.dockerignore**

```
node_modules
dist
.env
.env.*
*.log
.git
.gitignore
README.md
*.md
.vscode
.idea
coverage
.DS_Store
```

---

## 🔧 Comandos de Gestión

### **Operaciones Básicas**

```bash
# Iniciar servicios
docker compose up -d

# Detener servicios
docker compose down

# Reiniciar servicios
docker compose restart

# Reiniciar un servicio específico
docker compose restart backend

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Ver estado de servicios
docker compose ps

# Ver uso de recursos
docker stats
```

---

### **Actualizar Aplicación**

```bash
# 1. Detener servicios
docker compose down

# 2. Actualizar código (git pull o copiar archivos nuevos)
git pull

# 3. Reconstruir e iniciar
docker compose up -d --build

# 4. Verificar logs
docker compose logs -f
```

---

### **Backups de Base de Datos**

#### Backup Manual
```bash
# Crear backup
docker compose exec mysql mysqldump -u presupuestador -p${MYSQL_PASSWORD} mh_1 > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker compose exec -T mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backups/backup_20250115_120000.sql
```

#### Backup Automático (Linux)
```bash
# Crear script de backup
nano backup.sh
```

```bash
#!/bin/bash
cd /home/usuario/presupuestador-web
docker compose exec mysql mysqldump -u presupuestador -p${MYSQL_PASSWORD} mh_1 > backups/backup_$(date +%Y%m%d).sql
find backups/ -name "backup_*.sql" -mtime +7 -delete
```

```bash
# Dar permisos de ejecución
chmod +x backup.sh

# Programar con cron (diario a las 2 AM)
crontab -e
# Agregar línea:
0 2 * * * /home/usuario/presupuestador-web/backup.sh
```

#### Backup Automático (Windows)
```powershell
# Crear backup.bat
@echo off
cd C:\presupuestador-web
docker compose exec mysql mysqldump -u presupuestador -p%MYSQL_PASSWORD% mh_1 > backups\backup_%date:~-4%%date:~3,2%%date:~0,2%.sql
```

Programar en Tareas Programadas de Windows (diario a las 2 AM)

---

### **Acceso a Contenedores**

```bash
# Acceder a shell del backend
docker compose exec backend sh

# Acceder a MySQL
docker compose exec mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1

# Ver archivos del frontend
docker compose exec frontend sh
```

---

### **Limpieza y Mantenimiento**

```bash
# Ver espacio usado por Docker
docker system df

# Limpiar imágenes no usadas
docker system prune -a

# Limpiar volúmenes no usados (⚠️ CUIDADO)
docker volume prune

# Limpiar todo (⚠️ CUIDADO: borra BD)
docker compose down -v
docker system prune -a --volumes
```

---

## 🔒 Seguridad

### **Configurar Firewall**

#### Windows
```powershell
# Permitir puerto 80 (frontend)
netsh advfirewall firewall add rule name="Presupuestador Web" dir=in action=allow protocol=TCP localport=80

# Bloquear puerto 3306 (MySQL) desde red externa
netsh advfirewall firewall add rule name="Block MySQL External" dir=in action=block protocol=TCP localport=3306 remoteip=0.0.0.0-192.168.0.255
```

#### Linux
```bash
# Configurar UFW
sudo ufw allow 80/tcp
sudo ufw deny 3306/tcp
sudo ufw enable
```

---

## 🚨 Troubleshooting

### **Problema: Servicios no inician**

```bash
# Ver logs detallados
docker compose logs

# Verificar que los puertos no estén ocupados
# Windows:
netstat -ano | findstr :80
netstat -ano | findstr :3000

# Linux:
sudo lsof -i :80
sudo lsof -i :3000
```

---

### **Problema: Backend no conecta a MySQL**

```bash
# Verificar que MySQL esté saludable
docker compose ps

# Esperar a que MySQL termine de iniciar (30-60 segundos)
docker compose logs mysql

# Reiniciar backend después de que MySQL esté listo
docker compose restart backend
```

---

### **Problema: Frontend muestra error de API**

```bash
# Verificar que VITE_API_URL en .env tenga la IP correcta
cat .env | grep VITE_API_URL

# Reconstruir frontend con nueva configuración
docker compose up -d --build frontend
```

---

### **Problema: No se puede acceder desde otros PCs**

```bash
# Verificar IP del servidor
# Windows: ipconfig
# Linux: ip addr show

# Verificar firewall
# Windows: Panel de Control > Firewall
# Linux: sudo ufw status

# Verificar que los contenedores estén corriendo
docker compose ps

# Hacer ping desde otro PC
ping 192.168.1.100
```

---

## ✅ Checklist de Deployment

- [ ] Docker instalado y funcionando
- [ ] IP del servidor configurada y anotada
- [ ] Archivo `.env` creado con contraseñas seguras
- [ ] IP del servidor actualizada en `VITE_API_URL`
- [ ] Servicios iniciados: `docker compose up -d --build`
- [ ] Verificado estado: `docker compose ps` (todos "Up")
- [ ] Base de datos importada (si aplica)
- [ ] Acceso desde servidor: `http://localhost` funciona
- [ ] Acceso desde otro PC: `http://192.168.1.100` funciona
- [ ] Firewall configurado (puerto 80 abierto)
- [ ] Backup automático configurado
- [ ] Usuarios creados en la aplicación
- [ ] Documentación entregada al equipo

---

## 🎯 Próximos Pasos

1. **Capacitar usuarios** en el uso del sistema
2. **Configurar backup automático** (ver sección Backups)
3. **Monitorear logs** regularmente
4. **Actualizar aplicación** cuando haya nuevas versiones
5. **Documentar IP del servidor** para todo el equipo

---

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Costo:** $0 (100% Open Source)  
**Tiempo de Setup:** 5-10 minutos


---

## 🔄 Migrar de una Máquina a Otra

### **Opción 1: Copiar Todo (Más Simple)**

#### En Máquina Actual
```bash
# 1. Detener servicios
docker compose down

# 2. Crear backup de la base de datos
docker compose up -d mysql
docker compose exec mysql mysqldump -u presupuestador -p${MYSQL_PASSWORD} mh_1 > backup_completo.sql
docker compose down

# 3. Copiar toda la carpeta del proyecto a USB/Red
# Windows: Copiar C:\presupuestador-web a USB
# Linux: tar -czf presupuestador-backup.tar.gz presupuestador-web/
```

#### En la Nueva Máquina
```bash
# 1. Instalar Docker (ver pasos anteriores)

# 2. Copiar carpeta del proyecto desde USB/Red
# Windows: Pegar en C:\presupuestador-web
# Linux: tar -xzf presupuestador-backup.tar.gz

# 3. Editar .env con la NUEVA IP del servidor
nano .env
# Cambiar VITE_API_URL=http://192.168.1.XXX:3000

# 4. Iniciar servicios
cd presupuestador-web
docker compose up -d --build

# 5. Restaurar base de datos
docker compose exec -T mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backup_completo.sql

# 6. Verificar
docker compose ps
```

**Tiempo total: 10-15 minutos**

---

### **Opción 2: Exportar/Importar Imágenes Docker (Más Rápido)**

#### En Máquina Actual
```bash
# 1. Crear backup de BD
docker compose exec mysql mysqldump -u presupuestador -p${MYSQL_PASSWORD} mh_1 > backup.sql

# 2. Exportar imágenes Docker
docker save presupuestador-web-backend:latest -o backend-image.tar
docker save presupuestador-web-frontend:latest -o frontend-image.tar
docker save mysql:8.0 -o mysql-image.tar

# 3. Copiar a USB:
# - Carpeta del proyecto (sin node_modules, sin dist)
# - backend-image.tar, frontend-image.tar, mysql-image.tar
# - backup.sql
```

#### En Nueva Máquina
```bash
# 1. Instalar Docker
# 2. Copiar archivos desde USB
# 3. Importar imágenes
docker load -i backend-image.tar
docker load -i frontend-image.tar
docker load -i mysql-image.tar

# 4. Editar .env con nueva IP
# 5. Iniciar servicios (usa imágenes ya compiladas)
docker compose up -d

# 6. Restaurar BD
docker compose exec -T mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backup.sql
```

**Tiempo total: 5-10 minutos** (no recompila)

---

### **Opción 3: Git + Backup BD (Más Profesional)**

#### Configurar Git (Una sola vez)
```bash
# En máquina actual
cd presupuestador-web
git init
git add .
git commit -m "Initial commit"

# Opción A: GitHub privado (gratis)
git remote add origin https://github.com/tu-usuario/presupuestador-web.git
git push -u origin main

# Opción B: Git local en red compartida
git init --bare //servidor-red/presupuestador.git
git remote add origin //servidor-red/presupuestador.git
git push -u origin main
```

#### En Nueva Máquina
```bash
# 1. Instalar Docker
# 2. Clonar repositorio
git clone https://github.com/tu-usuario/presupuestador-web.git
cd presupuestador-web

# 3. Copiar backup de BD desde USB/Red
# 4. Editar .env con nueva IP
# 5. Iniciar
docker compose up -d --build

# 6. Restaurar BD
docker compose exec -T mysql mysql -u presupuestador -p${MYSQL_PASSWORD} mh_1 < backup.sql
```

**Ventaja:** Futuras actualizaciones solo requieren `git pull`

---

### **Comparación de Opciones**

| Método | Tiempo | Complejidad | Mejor Para |
|--------|--------|-------------|------------|
| **Copiar Todo** | 10-15 min | Baja | Primera vez, sin Git |
| **Exportar Imágenes** | 5-10 min | Media | Migración rápida |
| **Git + Backup** | 15 min inicial | Media | Múltiples servidores |

---

### **Archivos Importantes a Migrar**

#### Esenciales (SIEMPRE copiar)
```
presupuestador-web/
├── .env                    # ⚠️ Editar IP nueva
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── backup.sql              # Base de datos
```

#### NO copiar (se regeneran)
```
❌ node_modules/
❌ dist/
❌ backend/dist/
❌ frontend/dist/
❌ .git/ (si usas Opción 1 o 2)
```

---

### **Script de Migración Automática**

#### migrate.sh (Linux)
```bash
#!/bin/bash
# migrate.sh - Preparar para migración

echo "🔄 Preparando migración..."

# Backup BD
docker compose exec mysql mysqldump -u presupuestador -p${MYSQL_PASSWORD} mh_1 > backup_$(date +%Y%m%d).sql

# Detener servicios
docker compose down

# Crear archivo comprimido (sin node_modules, dist)
tar --exclude='node_modules' \
    --exclude='dist' \
    --exclude='backend/dist' \
    --exclude='frontend/dist' \
    --exclude='.git' \
    -czf presupuestador_migration_$(date +%Y%m%d).tar.gz \
    .

echo "✅ Archivo listo: presupuestador_migration_$(date +%Y%m%d).tar.gz"
echo "📋 Copiar a USB y ejecutar en nueva máquina:"
echo "   tar -xzf presupuestador_migration_*.tar.gz"
echo "   cd presupuestador-web"
echo "   nano .env  # Cambiar IP"
echo "   docker compose up -d --build"
```

#### migrate.bat (Windows)
```batch
@echo off
REM migrate.bat - Preparar para migración

echo Preparando migracion...

REM Backup BD
docker compose exec mysql mysqldump -u presupuestador -p%MYSQL_PASSWORD% mh_1 > backup_%date:~-4%%date:~3,2%%date:~0,2%.sql

REM Detener servicios
docker compose down

echo Listo para copiar carpeta completa a USB
echo Recuerda editar .env con nueva IP en el servidor destino
pause
```

---

### **Checklist de Migración**

#### En Máquina Actual:
- [ ] Backup de base de datos creado
- [ ] Servicios detenidos (`docker compose down`)
- [ ] Archivos copiados a USB/Red
- [ ] Verificar que .env está incluido

#### En Nueva Máquina:
- [ ] Docker instalado
- [ ] IP del servidor obtenida (ipconfig/ip addr)
- [ ] Archivos copiados desde USB/Red
- [ ] `.env` editado con nueva IP en `VITE_API_URL`
- [ ] Servicios iniciados (`docker compose up -d --build`)
- [ ] Base de datos restaurada
- [ ] Acceso verificado desde navegador
- [ ] Firewall configurado (puerto 80)

---

## 🌐 Configurar Nombre en lugar de IP

### **Opción 1: Archivo hosts (Más Simple - RECOMENDADO)**

#### En cada PC cliente (no en el servidor)

**Windows:**
```powershell
# 1. Abrir Bloc de notas como Administrador
# Clic derecho en Bloc de notas > Ejecutar como administrador

# 2. Abrir archivo hosts
# Archivo > Abrir > C:\Windows\System32\drivers\etc\hosts

# 3. Agregar al final del archivo:
192.168.1.100    presupuestador.local
192.168.1.100    presupuesto.local
192.168.1.100    presupuestador

# 4. Guardar y cerrar
```

**Linux/Mac:**
```bash
# Editar archivo hosts
sudo nano /etc/hosts

# Agregar al final:
192.168.1.100    presupuestador.local
192.168.1.100    presupuesto.local
192.168.1.100    presupuestador

# Guardar: Ctrl+O, Enter, Ctrl+X
```

**Acceder desde navegador:**
```
http://presupuestador.local
http://presupuesto.local
http://presupuestador
```

**Ventajas:**
- ✅ Gratis
- ✅ No requiere configuración en servidor
- ✅ Funciona inmediatamente
- ✅ No requiere DNS

**Desventajas:**
- ❌ Hay que configurar cada PC cliente
- ❌ Si cambia IP del servidor, hay que actualizar en todos los PCs

---

### **Opción 2: Servidor DNS Local (Profesional)**

#### Configurar en Router (si soporta DNS local)

1. Acceder al router (generalmente `http://192.168.1.1`)
2. Buscar sección "DNS Local" o "DHCP/DNS"
3. Agregar entrada:
   - Nombre: `presupuestador.local`
   - IP: `192.168.1.100`
4. Guardar y reiniciar router

**Ventajas:**
- ✅ Configuración centralizada
- ✅ Todos los PCs lo ven automáticamente
- ✅ Si cambia IP, solo actualizar en router

**Desventajas:**
- ❌ No todos los routers lo soportan
- ❌ Requiere acceso al router

---

### **Script para Configurar Hosts Automáticamente**

#### setup-hosts.bat (Windows - Ejecutar como Admin)
```batch
@echo off
REM setup-hosts.bat - Configurar nombre presupuestador

echo Configurando nombre presupuestador.local...

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Ejecutar como Administrador
    pause
    exit /b 1
)

REM Agregar entrada al archivo hosts
echo. >> C:\Windows\System32\drivers\etc\hosts
echo # Presupuestador Web >> C:\Windows\System32\drivers\etc\hosts
echo 192.168.1.100    presupuestador.local >> C:\Windows\System32\drivers\etc\hosts
echo 192.168.1.100    presupuesto.local >> C:\Windows\System32\drivers\etc\hosts
echo 192.168.1.100    presupuestador >> C:\Windows\System32\drivers\etc\hosts

echo.
echo Configuracion completada!
echo Ahora puedes acceder a: http://presupuestador.local
echo.
pause
```

#### setup-hosts.sh (Linux - Ejecutar con sudo)
```bash
#!/bin/bash
# setup-hosts.sh - Configurar nombre presupuestador

echo "Configurando nombre presupuestador.local..."

# Verificar permisos
if [ "$EUID" -ne 0 ]; then 
    echo "ERROR: Ejecutar con sudo"
    exit 1
fi

# Agregar entrada al archivo hosts
echo "" >> /etc/hosts
echo "# Presupuestador Web" >> /etc/hosts
echo "192.168.1.100    presupuestador.local" >> /etc/hosts
echo "192.168.1.100    presupuesto.local" >> /etc/hosts
echo "192.168.1.100    presupuestador" >> /etc/hosts

echo ""
echo "✅ Configuración completada!"
echo "Ahora puedes acceder a: http://presupuestador.local"
```

---

### **Configuración Completa con Nombre**

#### 1. En el Servidor:
```bash
# Editar .env
nano .env
```

```env
# Cambiar VITE_API_URL
VITE_API_URL=http://presupuestador.local:3000
```

```bash
# Reconstruir frontend
docker compose up -d --build frontend
```

#### 2. En cada PC Cliente:

**Opción A: Manual**
```
1. Abrir Bloc de notas como Administrador
2. Abrir: C:\Windows\System32\drivers\etc\hosts
3. Agregar: 192.168.1.100    presupuestador.local
4. Guardar
```

**Opción B: Script automático**
```
1. Copiar setup-hosts.bat a USB
2. En cada PC: Clic derecho > Ejecutar como Administrador
3. Listo
```

#### 3. Verificar:
```
Abrir navegador en cualquier PC:
http://presupuestador.local
```

---

### **Si Cambia la IP del Servidor**

#### Actualizar en Servidor:
```bash
# 1. Editar .env con nueva IP
nano .env
# VITE_API_URL=http://presupuestador.local:3000 (no cambiar)

# 2. Reconstruir
docker compose up -d --build frontend
```

#### Actualizar en Clientes:
```powershell
# Windows (como Admin)
notepad C:\Windows\System32\drivers\etc\hosts

# Cambiar:
# De: 192.168.1.100    presupuestador.local
# A:  192.168.1.150    presupuestador.local
```

---

### **Comparación de Opciones de Nombres**

| Método | Dificultad | Centralizado | Mejor Para |
|--------|------------|--------------|------------|
| **Archivo hosts** | Baja | No | 1-10 PCs |
| **DNS en Router** | Media | Sí | 10+ PCs |
| **Windows Server DNS** | Alta | Sí | Empresas |

---

### **Nombres Sugeridos**

```
presupuestador.local    (formal)
presupuesto.local       (corto)
presupuestador          (más corto)
mh.local                (iniciales empresa)
sistema.local           (genérico)
```

**Nota:** Usar `.local` es estándar para redes locales

---

### **Checklist de Configuración de Nombre**

- [ ] Decidir nombre (ej: presupuestador.local)
- [ ] Actualizar .env en servidor con nuevo nombre
- [ ] Reconstruir frontend: `docker compose up -d --build frontend`
- [ ] Crear script setup-hosts.bat
- [ ] Ejecutar script en cada PC cliente
- [ ] Verificar acceso: `http://presupuestador.local`
- [ ] Crear acceso directo en escritorio de cada PC
- [ ] Documentar nombre para usuarios

---

## 📞 Soporte y Contacto

### **Información del Sistema**

```bash
# Versión de Docker
docker --version
docker compose version

# Estado de servicios
docker compose ps

# Uso de recursos
docker stats --no-stream

# Guardar logs para análisis
docker compose logs > logs_$(date +%Y%m%d).txt
```

---

**Última actualización:** Enero 2025  
**Versión:** 1.1  
**Incluye:** Migración entre máquinas + Configuración de nombres de dominio
