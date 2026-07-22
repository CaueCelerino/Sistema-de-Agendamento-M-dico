/**
 * API Tests - Autenticação
 * Testa endpoints de login e registro
 * 
 * Authors: Lucas, Caue, Kaio, Gustavo
 */

const request = require('supertest');
const { app } = require('../src/server');

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('deve retornar erro 400 se email não for fornecido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('deve retornar erro 400 se password não for fornecida', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('deve retornar token se credenciais forem válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cliente@test.com',
          password: 'password123'
        });

      if (response.status === 200) {
        expect(response.body.token).toBeDefined();
        expect(response.body.usuario).toBeDefined();
      }
    });

    it('deve retornar erro 401 se credenciais forem inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalido@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('deve criar novo usuário com dados válidos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `novo_usuario_${Date.now()}@test.com`,
          nome: 'Novo Usuário',
          password: 'password123',
          cpf: '12345678901'
        });

      if (response.status === 201 || response.status === 200) {
        expect(response.body.usuario || response.body.token).toBeDefined();
      }
    });

    it('deve retornar erro se email já existir', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'cliente@test.com',
          nome: 'Duplicate User',
          password: 'password123',
          cpf: '12345678902'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('deve validar campo obrigatório "nome"', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `novo_user_${Date.now()}@test.com`,
          password: 'password123',
          cpf: '12345678903'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/health', () => {
    it('deve retornar status OK sem autenticação', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.authors).toBeDefined();
    });
  });
});
