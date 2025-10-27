import request from 'supertest';
import express from 'express';

// Mock app for testing
const app = express();
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test successful' });
});

describe('API Tests', () => {
  test('GET /api/test should return success message', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body.message).toBe('Test successful');
  });
});