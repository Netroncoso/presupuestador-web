# 🐳 Docker Setup

## Requisitos
- Docker Desktop instalado
- Docker Compose instalado

## Configuración Inicial

1. **Copiar variables de entorno:**
```bash
cp .env.example .env
```

2. **Editar `.env` con tus valores:**
```env
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=mh_1
JWT_SECRET=tu_secret_key
```

## Comandos

### Iniciar todo (primera vez)
```bash
docker-compose up -d --build
```

### Iniciar (después de la primera vez)
```bash
docker-compose up -d
```

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Detener
```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ borra la BD)
```bash
docker-compose down -v
```

### Reconstruir después de cambios
```bash
docker-compose up -d --build
```

## Acceso

- **Frontend:** http://localhost
- **Backend API:** http://localhost:4000
- **MySQL:** localhost:3306

## Importar Base de Datos

```bash
# Copiar dump al contenedor
docker cp backup.sql presupuestador-mysql:/backup.sql

# Importar
docker exec -i presupuestador-mysql mysql -uroot -p${DB_PASSWORD} mh_1 < /backup.sql
```

## Backup de Base de Datos

```bash
docker exec presupuestador-mysql mysqldump -uroot -p${DB_PASSWORD} mh_1 > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Puerto 3306 ocupado
Si ya tienes MySQL corriendo localmente:
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "3307:3306"  # Usar 3307 en lugar de 3306
```

### Puerto 80 ocupado
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8080:80"  # Acceder en http://localhost:8080
```

### Ver estado de contenedores
```bash
docker-compose ps
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
```
