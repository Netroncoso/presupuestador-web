import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import presupuestosV2Routes from '../src/routes/presupuestosV2';

// Mock app setup
const app = express();
app.use(express.json());
app.use('/api/presupuestos', presupuestosV2Routes);

// Mock JWT secret
process.env.JWT_SECRET = 'test-secret';

// Helper to create valid JWT token
const createToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

describe('Presupuestos V2 Routes - Refactored', () => {
  const validToken = createToken({ 
    id: 1, 
    rol: 'usuario_normal',
    username: 'test-user'
  });

  describe('Authentication', () => {
    test('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/presupuestos')
        .expect(401);
      
      expect(response.body.error).toBe('Token requerido');
    });

    test('should accept valid tokens', async () => {
      const response = await request(app)
        .get('/api/presupuestos')
        .set('Authorization', `Bearer ${validToken}`);
      
      // Should not be 401 or 403 (auth passed)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Validation Middleware', () => {
    test('should validate presupuesto ID in params', async () => {
      const response = await request(app)
        .get('/api/presupuestos/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
      
      expect(response.body.error).toBe('ID de presupuesto debe ser un número válido');
    });

    test('should validate DNI format in creation', async () => {
      const invalidData = {
        paciente: 'Juan Pérez',
        dni: 'invalid-dni', // Should be numeric
        financiador_id: 1,
        sucursal_id: 1
      };

      const response = await request(app)
        .post('/api/presupuestos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(response.body.error).toBe('DNI debe ser un número válido');
    });

    test('should accept valid DNI format', async () => {
      const validData = {
        paciente: 'Juan Pérez',
        dni: '12345678',
        financiador_id: 1,
        sucursal_id: 1
      };

      const response = await request(app)
        .post('/api/presupuestos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validData);
      
      // Should not be 400 for validation
      expect(response.status).not.toBe(400);
    });
  });

  describe('Route Structure', () => {
    test('should have all CRUD endpoints', async () => {
      const getEndpoints = [
        '/api/presupuestos',
        '/api/presupuestos/123'
      ];

      for (const endpoint of getEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${validToken}`);
        
        // Should not be 404 (route exists)
        expect(response.status).not.toBe(404);
      }
    });

    test('should handle POST requests', async () => {
      const response = await request(app)
        .post('/api/presupuestos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});
      
      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    test('should handle PUT requests', async () => {
      const response = await request(app)
        .put('/api/presupuestos/123')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});
      
      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });

  describe('Error Handling', () => {
    test('should handle async errors gracefully', async () => {
      // This should trigger an error in the service layer
      const response = await request(app)
        .get('/api/presupuestos/999999')
        .set('Authorization', `Bearer ${validToken}`);
      
      // Should return structured error response
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});