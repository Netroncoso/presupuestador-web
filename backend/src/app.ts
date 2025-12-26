import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import sucursalesRoutes from './routes/sucursales';
import presupuestosV2Routes from './routes/presupuestosV2';
import notificacionesRoutes from './routes/notificaciones';
import auditoriaRoutes from './routes/auditoria-simple';
import auditoriaMultiRoutes from './routes/auditoria-multi';
import presupuestoInsumosRoutes from './routes/presupuestoInsumos';
import presupuestoPrestacionesRoutes from './routes/presupuestoPrestaciones';
import insumosRoutes from './routes/insumos';
import prestacionesRoutes from './routes/prestaciones';
import authRoutes from './routes/auth';
import adminInsumosRoutes from './routes/admin/adminInsumos';
import adminPrestadoresRoutes from './routes/admin/adminPrestadores';
import adminServiciosRoutes from './routes/admin/adminServicios';
import adminServiciosCrudRoutes from './routes/admin/adminServiciosCrud';
import adminSucursalesRoutes from './routes/admin/adminSucursales';
import adminUsuariosRoutes from './routes/adminUsuarios';
import configuracionRoutes from './routes/configuracion';
import alertasServiciosRoutes from './routes/alertasServicios';
import alertasEquipamientosRoutes from './routes/alertasEquipamientos';
import tiposUnidadRoutes from './routes/tiposUnidad';
import reportesFinancierosRoutes from './routes/reportesFinancieros';
import sseRoutes from './routes/sse';
import healthRoutes from './routes/health';
import cacheStatsRoutes from './routes/cacheStats';
import equipamientosRoutes from './routes/equipamientos';
import { csrfProtection } from './middleware/csrf';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { iniciarCronJobs } from './services/cronJobs';

dotenv.config();
const app = express();

// Iniciar cron jobs
iniciarCronJobs();

// CORS configuration
let allowedOrigins: string[] = [];
try {
  allowedOrigins = process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || [];
} catch (error) {
  logger.error('Error parsing FRONTEND_URL', error instanceof Error ? error.message : 'Unknown error');
}

app.use(cors({ 
  origin: (origin, callback) => {
    // En desarrollo, permitir cualquier origen localhost o 172.26.x.x (WSL)
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'development' && (origin?.includes('localhost') || origin?.includes('172.26.')))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(express.json({ limit: '10mb' }));

// Auth routes (public - sin CSRF)
app.use('/api/auth', authRoutes);

// Health check (public - sin CSRF)
app.use('/api/health', healthRoutes);

// CSRF protection para rutas protegidas
app.use(csrfProtection);

// SSE routes (protected, but handles auth internally)
app.use('/api/stream', sseRoutes);

// Protected routes
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/presupuestos', presupuestosV2Routes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/auditoria', auditoriaRoutes); // Sistema simple (deprecado)
app.use('/api/auditoria-multi', auditoriaMultiRoutes); // Sistema multi-gerencial
app.use('/api/presupuestos', presupuestoInsumosRoutes); // /:id/insumos
app.use('/api/presupuestos', presupuestoPrestacionesRoutes); // /:id/prestaciones
app.use('/api/presupuesto-insumos', presupuestoInsumosRoutes); // /:id
app.use('/api/presupuesto-prestaciones', presupuestoPrestacionesRoutes); // /:id
app.use('/api/insumos', insumosRoutes);
app.use('/api/prestaciones', prestacionesRoutes);

// Admin routes
app.use('/api/admin/insumos', adminInsumosRoutes);
app.use('/api/admin/prestadores', adminPrestadoresRoutes);
app.use('/api/admin/servicios', adminServiciosRoutes);
app.use('/api/admin/servicios-crud', adminServiciosCrudRoutes);
app.use('/api/admin/sucursales', adminSucursalesRoutes);
app.use('/api/admin', adminUsuariosRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/alertas-servicios', alertasServiciosRoutes);
app.use('/api/alertas-equipamientos', alertasEquipamientosRoutes);
app.use('/api/tipos-unidad', tiposUnidadRoutes);
app.use('/api/reportes/financiero', reportesFinancierosRoutes);
app.use('/api/cache', cacheStatsRoutes);
app.use('/api/equipamientos', equipamientosRoutes);

// Global error handler
app.use(errorHandler);

const port = parseInt(process.env.PORT || '4000');
app.listen(port, '0.0.0.0', () => {
  logger.info(`Backend listening on port ${port}`);
}).on('error', (err) => {
  const errorMsg = err instanceof Error ? err.message.replace(/[\r\n]/g, ' ') : 'Unknown error';
  logger.error('Failed to start server', errorMsg);
  process.exit(1);
});
