import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import sucursalesRoutes from './routes/sucursales';
import presupuestosRoutes from './routes/presupuestos';
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

dotenv.config();
const app = express();

// CORS configuration
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
app.use(express.json({ limit: '10mb' }));

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/presupuestos', presupuestoInsumosRoutes); // /:id/insumos
app.use('/api/presupuestos', presupuestoPrestacionesRoutes); // /:id/prestaciones
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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err instanceof Error ? err.message : 'Unknown error');
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : 'Unknown error');
  process.exit(1);
});