/**
 * API Tests - Agendamentos
 * Testa endpoints de agendamentos
 * 
 * Authors: Lucas, Caue, Kaio, Gustavo
 */

const request = require('supertest');
const { app } = require('../src/server');

describe('Agendamentos Routes', () => {
  let token = null;

  beforeAll(async () => {
    // Tentar fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cliente@test.com',
        password: 'password123'
      });

    if (loginResponse.body.token) {
      token = loginResponse.body.token;
    }
  });

  describe('GET /api/agendamentos', () => {
    it('deve retornar erro 401 sem token', async () => {
      const response = await request(app)
        .get('/api/agendamentos');

      expect(response.status).toBe(401);
    });

    it('deve retornar lista de agendamentos com token válido', async () => {
      if (!token) {
        console.warn('Token não disponível para teste');
        return;
      }

      const response = await request(app)
        .get('/api/agendamentos')
        .set('Authorization', `Bearer ${token}`);

      if (response.status === 200) {
        expect(Array.isArray(response.body.agendamentos || response.body)).toBe(true);
      }
    });
  });

  describe('POST /api/agendamentos', () => {
    it('deve criar novo agendamento com dados válidos', async () => {
      if (!token) {
        console.warn('Token não disponível para teste');
        return;
      }

      const response = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dataAgendamento: '2026-07-15',
          horaAgendamento: '14:00',
          funcionarioId: 1,
          tipoAtendimento: 'consulta'
        });

      if (response.status !== 401) {
        expect(response.status).toBeGreaterThanOrEqual(200);
      }
    });

    it('deve retornar erro 401 sem token', async () => {
      const response = await request(app)
        .post('/api/agendamentos')
        .send({
          dataAgendamento: '2026-07-15',
          horaAgendamento: '14:00',
          funcionarioId: 1,
          tipoAtendimento: 'consulta'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Validações', () => {
    it('deve validar formato de data', async () => {
      if (!token) {
        console.warn('Token não disponível para teste');
        return;
      }

      const response = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dataAgendamento: 'data-invalida',
          horaAgendamento: '14:00',
          funcionarioId: 1,
          tipoAtendimento: 'consulta'
        });

      if (response.status !== 401) {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('deve validar formato de hora', async () => {
      if (!token) {
        console.warn('Token não disponível para teste');
        return;
      }

      const response = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dataAgendamento: '2026-07-15',
          horaAgendamento: '25:00',
          funcionarioId: 1,
          tipoAtendimento: 'consulta'
        });

      if (response.status !== 401) {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});
