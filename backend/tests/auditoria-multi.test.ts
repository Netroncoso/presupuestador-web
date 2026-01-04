import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import auditoriaMultiRoutes from '../src/routes/auditoria-multi';

// Mock app setup
const app = express();
app.use(express.json());
app.use('/api/auditoria-multi', auditoriaMultiRoutes);

// Mock JWT secret
process.env.JWT_SECRET = 'test-secret';

// Helper to create valid JWT token
const createToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

describe('Auditoria Multi Routes - Refactored', () => {
  const validToken = createToken({ 
    id: 1, 
    rol: 'gerencia_administrativa',
    username: 'test-user'
  });

  describe('Authentication & Authorization', () => {
    test('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/auditoria-multi/pendientes')
        .expect(401);
      
      expect(response.body.error).toBe('Token requerido');
    });

    test('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/auditoria-multi/pendientes')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
      
      expect(response.body.error).toBe('Token inválido');
    });

    test('should accept valid tokens', async () => {
      // This will fail at service level but should pass auth
      const response = await request(app)
        .get('/api/auditoria-multi/pendientes')
        .set('Authorization', `Bearer ${validToken}`);
      
      // Should not be 401 or 403 (auth passed)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Validation Middleware', () => {
    test('should validate presupuesto ID format', async () => {
      const response = await request(app)
        .post('/api/auditoria-multi/tomar/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
      
      expect(response.body.error).toBe('ID de presupuesto debe ser un número válido');
    });

    test('should accept valid presupuesto ID', async () => {
      // This will fail at service level but should pass validation
      const response = await request(app)
        .post('/api/auditoria-multi/tomar/123')
        .set('Authorization', `Bearer ${validToken}`);
      
      // Should not be 400 for validation
      expect(response.status).not.toBe(400);
    });
  });

  describe('Route Structure', () => {
    test('should have all required endpoints', async () => {
      const endpoints = [
        '/api/auditoria-multi/pendientes',
        '/api/auditoria-multi/mis-casos',
        '/api/auditoria-multi/historial'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${validToken}`);
        
        // Should not be 404 (route exists)
        expect(response.status).not.toBe(404);
      }
    });
  });
});