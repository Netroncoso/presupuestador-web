# Guía de Seguridad

## Configuración Inicial

### 1. Variables de Entorno
Copiar `.env.example` a `.env` y configurar con valores reales:

```bash
cp .env.example .env
```

**IMPORTANTE:** Nunca commitear el archivo `.env` al repositorio.

### 2. Generar Secrets Seguros

Para producción, generar secrets aleatorios:

```bash
# En Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Actualizar Contraseñas de Usuarios

Usar el script seguro:

```bash
node hash-passwords.js <username> <password>
```

Ejemplo:
```bash
node hash-passwords.js admin miPasswordSeguro123!
node hash-passwords.js prueba otraPasswordSegura456!
```

## Checklist de Seguridad

- [ ] `.env` está en `.gitignore`
- [ ] Secrets de producción son únicos y aleatorios
- [ ] Contraseñas de usuarios son fuertes
- [ ] Base de datos usa usuario con permisos mínimos necesarios
- [ ] HTTPS habilitado en producción
