import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import sucursalesRoutes from './routes/sucursales';
import presupuestosRoutes from './routes/presupuestos';
// import presupuestosV2Routes from './routes/presupuestosV2-working';
import notificacionesRoutes from './routes/notificaciones';
import auditoriaRoutes from './routes/auditoria-simple';
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
import sseRoutes from './routes/sse';
import { csrfProtection } from './middleware/csrf';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();
const app = express();

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || [];
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
app.use(csrfProtection);

// Auth routes (public)
app.use('/api/auth', authRoutes);

// SSE routes (protected, but handles auth internally)
app.use('/api/stream', sseRoutes);

// Protected routes
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
// app.use('/api/v2/presupuestos', presupuestosV2Routes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/auditoria', auditoriaRoutes);
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

// Global error handler
app.use(errorHandler);

const port = parseInt(process.env.PORT || '4000');
app.listen(port, '0.0.0.0', () => {
  logger.info(`Backend listening on port ${port}`);
}).on('error', (err) => {
  logger.error('Failed to start server', err instanceof Error ? err.message : 'Unknown error');
  process.exit(1);
});
