import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import basicAuth from 'express-basic-auth';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema Presupuestador Web API',
      version: '3.1.0',
      description: `
        API REST completa para gestión de presupuestos médicos con auditoría multi-gerencial.
        
        ## Características principales:
        - Sistema de versiones de presupuestos
        - Valores históricos (timelapse) por sucursal
        - Auditoría multi-gerencial con FCFS
        - Gestión de insumos, prestaciones y equipamientos
        - Alertas configurables por tipo
        - Notificaciones en tiempo real (SSE)
        
        ## Autenticación:
        1. Obtén un token JWT desde /api/auth/login
        2. Haz clic en "Authorize" y pega el token
        3. El token se enviará automáticamente en todas las peticiones
      `,
      contact: {
        name: 'Equipo de Desarrollo',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT obtenido desde /api/auth/login',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Autenticación y autorización' },
      { name: 'Presupuestos', description: 'Gestión de presupuestos médicos' },
      { name: 'Presupuestos - Items', description: 'Insumos, prestaciones y equipamientos de presupuestos' },
      { name: 'Insumos', description: 'Catálogo de insumos médicos' },
      { name: 'Prestaciones', description: 'Servicios y prestaciones por financiador' },
      { name: 'Equipamientos', description: 'Equipamiento médico con valores históricos' },
      { name: 'Auditoría Multi-Gerencial', description: 'Sistema de auditoría con 4 gerencias' },
      { name: 'Auditoría Simple (Deprecado)', description: 'Sistema simple de auditoría (deprecado)' },
      { name: 'Notificaciones', description: 'Notificaciones en tiempo real' },
      { name: 'Admin - Usuarios', description: 'Gestión de usuarios (Super Admin)' },
      { name: 'Admin - Insumos', description: 'Administración de insumos' },
      { name: 'Admin - Financiadores', description: 'Administración de financiadores' },
      { name: 'Admin - Servicios', description: 'Administración de servicios por financiador' },
      { name: 'Admin - Servicios CRUD', description: 'CRUD de servicios base' },
      { name: 'Admin - Sucursales', description: 'Administración de sucursales' },
      { name: 'Admin - Tipos de Unidad', description: 'Tipos de unidad de servicios' },
      { name: 'Alertas', description: 'Configuración de alertas por tipo' },
      { name: 'Configuración', description: 'Reglas de negocio y umbrales' },
      { name: 'Reportes Financieros', description: 'KPIs y análisis financiero (Gerencia Financiera)' },
      { name: 'Sucursales', description: 'Consulta de sucursales' },
      { name: 'Sistema - Health', description: 'Health check y monitoreo' },
      { name: 'Sistema - Cache', description: 'Estadísticas y gestión de cache' },
      { name: 'Sistema - SSE', description: 'Server-Sent Events para tiempo real' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/admin/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Autenticación básica para Swagger
  const swaggerAuth = basicAuth({
    users: { 
      'admin': process.env.SWAGGER_PASSWORD || 'swagger2025' 
    },
    challenge: true,
    realm: 'Swagger Documentation'
  });

  app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Presupuestador API Docs',
  }));
};
