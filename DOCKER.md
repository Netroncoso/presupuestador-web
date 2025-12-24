# 🐳 Docker - Guía Completa

## 📋 Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Instalación Rápida](#instalación-rápida)
3. [Configuración](#configuración)
4. [Comandos Básicos](#comandos-básicos)
5. [Acceso desde Red Local](#acceso-desde-red-local)
6. [Base de Datos](#base-de-datos)
7. [Producción](#producción)
8. [Migración entre Máquinas](#migración-entre-máquinas)
9. [Configurar Nombre de Dominio](#configurar-nombre-de-dominio)
10. [Troubleshooting](#troubleshooting)

---

## Requisitos

- Docker Desktop instalado
- Docker Compose instalado
- Mínimo 4GB RAM, 50GB disco
- Red local configurada (para acceso remoto)

### Instalación de Docker

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

## Instalación Rápida

### 1. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Database
DB_USER=root
DB_PASSWORD=tu_password_seguro
DB_NAME=mh_1

# Backend
JWT_SECRET=tu_secret_key_minimo_32_caracteres
```

### 2. Obtener IP del Servidor (para acceso en red)

```bash
# Windows
ipconfig | findstr /i "IPv4"

# Linux
ip addr show
```

Anotar la IP (ejemplo: 192.168.1.197)

### 3. Iniciar Aplicación

```bash
# Primera vez (construye imágenes)
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

---

## Comandos Básicos

### Operaciones Diarias

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Reiniciar servicio específico
docker-compose restart backend

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de servicio específico
docker-compose logs -f backend

# Ver estado de contenedores
docker-compose ps

# Ver uso de recursos
docker stats
```

### Actualizar Aplicación

```bash
# 1. Detener servicios
docker-compose down

# 2. Actualizar código (git pull o copiar archivos)
git pull

# 3. Reconstruir e iniciar
docker-compose up -d --build

# 4. Verificar logs
docker-compose logs -f
```

---

## Acceso desde Red Local

Para acceder desde otros dispositivos en tu red:

### 1. Configurar CORS

Editar `docker-compose.yml`:

```yaml
backend:
  environment:
    FRONTEND_URL: http://localhost,http://192.168.1.197,http://presupuestador.local
```

### 2. Configurar Firewall

#### Windows (ejecutar como Administrador)
```cmd
netsh advfirewall firewall add rule name="Docker Frontend" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Docker Backend" dir=in action=allow protocol=TCP localport=4000
```

#### Linux
```bash
sudo ufw allow 80/tcp
sudo ufw allow 4000/tcp
sudo ufw enable
```

### 3. Recrear Backend

```bash
docker-compose up -d backend
```

### 4. Acceder desde Otros Dispositivos

- Frontend: `http://192.168.1.197`
- Backend API: `http://192.168.1.197:4000`

---

## Base de Datos

### Importar Base de Datos

```bash
# Método directo
docker exec -i presupuestador-mysql mysql -u root -pMedihome2006 mh_1 < backup.sql

# O copiar al contenedor primero
docker cp backup.sql presupuestador-mysql:/backup.sql
docker exec presupuestador-mysql mysql -u root -pMedihome2006 mh_1 < /backup.sql
```

### Backup de Base de Datos

#### Backup Manual
```bash
# Windows
docker exec presupuestador-mysql mysqldump -u root -pMedihome2006 mh_1 > backup_%date:~-4%%date:~3,2%%date:~0,2%.sql

# Linux
docker exec presupuestador-mysql mysqldump -u root -pMedihome2006 mh_1 > backup_$(date +%Y%m%d).sql
```

#### Backup Automático (Linux)

Crear `backup.sh`:

```bash
#!/bin/bash
cd /ruta/presupuestador-web
docker exec presupuestador-mysql mysqldump -u root -pMedihome2006 mh_1 > backups/backup_$(date +%Y%m%d).sql
find backups/ -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x backup.sh

# Programar con cron (diario a las 2 AM)
crontab -e
# Agregar: 0 2 * * * /ruta/presupuestador-web/backup.sh
```

#### Backup Automático (Windows)

Crear `backup.bat`:

```batch
@echo off
cd C:\presupuestador-web
docker exec presupuestador-mysql mysqldump -u root -pMedihome2006 mh_1 > backups\backup_%date:~-4%%date:~3,2%%date:~0,2%.sql
```

Programar en Tareas Programadas de Windows (diario a las 2 AM)

---

## Producción

### Diferencias con Desarrollo

**Seguridad:**
- ✅ MySQL NO expuesto (solo red interna)
- ✅ Puertos no estándar (8080 frontend, 8500 backend)
- ✅ Red Docker aislada
- ✅ Variables de entorno seguras

### Usar docker-compose.prod.yml

```bash
# Iniciar en producción
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Detener
docker-compose -f docker-compose.prod.yml down
```

### Acceso en Producción

- Frontend: `http://TU_IP:8080`
- Backend API: `http://TU_IP:8500`
- MySQL: NO accesible desde fuera (solo contenedores)

### Firewall en Producción

```cmd
netsh advfirewall firewall add rule name="Presupuestador Frontend" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="Presupuestador Backend" dir=in action=allow protocol=TCP localport=8500
```

### Recomendaciones Adicionales

1. Usar HTTPS con certificado SSL (Let's Encrypt)
2. Configurar reverse proxy (nginx) para SSL
3. Cambiar JWT_SECRET a valor fuerte
4. Cambiar DB_PASSWORD a contraseña compleja
5. Configurar backups automáticos
6. Limitar acceso por IP si es posible

---

## Migración entre Máquinas

### Opción 1: Copiar Todo (Más Simple)

#### En Máquina Actual
```bash
# 1. Detener servicios
docker-compose down

# 2. Crear backup de BD
docker-compose up -d mysql
docker exec presupuestador-mysql mysqldump -u root -pMedihome2006 mh_1 > backup_completo.sql
docker-compose down

# 3. Copiar carpeta completa a USB/Red
```

#### En Nueva Máquina
```bash
# 1. Instalar Docker
# 2. Copiar carpeta desde USB/Red
# 3. Editar .env con NUEVA IP
# 4. Iniciar servicios
docker-compose up -d --build

# 5. Restaurar BD
docker exec -i presupuestador-mysql mysql -u root -pMedihome2006 mh_1 < backup_completo.sql
```

### Opción 2: Git + Backup (Profesional)

```bash
# En máquina actual
git push

# En nueva máquina
git clone https://github.com/tu-usuario/presupuestador-web.git
cd presupuestador-web
# Copiar backup.sql
# Editar .env
docker-compose up -d --build
docker exec -i presupuestador-mysql mysql -u root -pMedihome2006 mh_1 < backup.sql
```

---

## Configurar Nombre de Dominio

### Opción 1: Archivo hosts (Recomendado)

#### En cada PC Cliente

**Windows:**
```powershell
# 1. Abrir Bloc de notas como Administrador
# 2. Abrir: C:\Windows\System32\drivers\etc\hosts
# 3. Agregar al final:
192.168.1.197    presupuestador.local

# 4. Guardar
```

**Linux/Mac:**
```bash
sudo nano /etc/hosts

# Agregar:
192.168.1.197    presupuestador.local
```

**Acceder:**
```
http://presupuestador.local
```

### Opción 2: DNS en Router

1. Acceder al router (`http://192.168.1.1`)
2. Buscar "DNS Local" o "DHCP/DNS"
3. Agregar entrada:
   - Nombre: `presupuestador.local`
   - IP: `192.168.1.197`
4. Guardar y reiniciar router

### Script Automático (Windows)

Crear `setup-hosts.bat`:

```batch
@echo off
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Ejecutar como Administrador
    pause
    exit /b 1
)

echo. >> C:\Windows\System32\drivers\etc\hosts
echo # Presupuestador Web >> C:\Windows\System32\drivers\etc\hosts
echo 192.168.1.197    presupuestador.local >> C:\Windows\System32\drivers\etc\hosts

echo Configuracion completada!
echo Acceder a: http://presupuestador.local
pause
```

---

## Troubleshooting

### Puerto Ocupado

```bash
# Ver qué usa el puerto
# Windows:
netstat -ano | findstr :80
netstat -ano | findstr :4000

# Linux:
sudo lsof -i :80
sudo lsof -i :4000

# Cambiar puerto en docker-compose.yml
ports:
  - "8080:80"  # Usar 8080 en lugar de 80
```

### Backend no Conecta a MySQL

```bash
# Verificar que MySQL esté saludable
docker-compose ps

# Ver logs de MySQL
docker-compose logs mysql

# Esperar 30-60 segundos y reiniciar backend
docker-compose restart backend
```

### No se Puede Acceder desde Otros PCs

```bash
# Verificar IP del servidor
ipconfig  # Windows
ip addr   # Linux

# Verificar firewall
# Windows: Panel de Control > Firewall
# Linux: sudo ufw status

# Verificar contenedores
docker-compose ps

# Hacer ping desde otro PC
ping 192.168.1.197
```

### Limpieza y Mantenimiento

```bash
# Ver espacio usado
docker system df

# Limpiar imágenes no usadas
docker system prune -a

# Limpiar volúmenes (⚠️ CUIDADO: borra BD)
docker volume prune

# Limpiar todo (⚠️ CUIDADO)
docker-compose down -v
docker system prune -a --volumes
```

---

## Checklist de Deployment

- [ ] Docker instalado y funcionando
- [ ] IP del servidor configurada
- [ ] Archivo `.env` creado con contraseñas seguras
- [ ] Servicios iniciados: `docker-compose up -d --build`
- [ ] Estado verificado: `docker-compose ps` (todos "Up")
- [ ] Base de datos importada
- [ ] Acceso desde servidor: `http://localhost` funciona
- [ ] Acceso desde otro PC: `http://192.168.1.197` funciona
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Usuarios creados en la aplicación

---

## Información del Sistema

```bash
# Versión de Docker
docker --version
docker compose version

# Estado de servicios
docker-compose ps

# Uso de recursos
docker stats --no-stream

# Guardar logs para análisis
docker-compose logs > logs_$(date +%Y%m%d).txt
```

---

**Versión:** 2.0 (Unificado)  
**Última actualización:** Diciembre 2024  
**Estado:** ✅ Producción
