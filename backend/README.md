# Backend - Presupuestador

## Configuración

1. Copiar `.env.example` a `.env` y completar variables
2. Instalar dependencias: `npm install`
3. Ejecutar migraciones SQL desde la carpeta `migrations/`
4. Ejecutar en desarrollo: `npm run dev`

El servidor escucha en `http://localhost:4000` por defecto.

## Estructura

- `src/controllers/` - Lógica de negocio
- `src/routes/` - Definición de endpoints
- `src/middleware/` - Validaciones y autenticación
- `src/utils/` - Funciones auxiliares
- `migrations/` - Scripts SQL de base de datos

## Validaciones

- DNI: 7-8 dígitos numéricos (validado en backend)
- Autenticación: JWT con bcrypt
