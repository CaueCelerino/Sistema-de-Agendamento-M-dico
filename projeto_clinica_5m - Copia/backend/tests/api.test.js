const test = require('node:test');
const assert = require('node:assert/strict');

process.env.PORT = '0';
const { app } = require('../src/server');
const db = require('../src/config/db');

let server;
let baseUrl;

test.before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test('health endpoint returns status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.status, 'OK');
});

test('admin dashboard exposes all summary counts', async () => {
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@clinica.com', senha: 'admin123' }),
  });

  const loginPayload = await loginResponse.json();
  assert.equal(loginResponse.status, 200);
  assert.ok(loginPayload.token);

  const dashboardResponse = await fetch(`${baseUrl}/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${loginPayload.token}`,
    },
  });

  const dashboardPayload = await dashboardResponse.json();

  assert.equal(dashboardResponse.status, 200);
  assert.ok(dashboardPayload.resumo);
  assert.ok(Number.isInteger(dashboardPayload.resumo.total_usuarios));
  assert.ok(Number.isInteger(dashboardPayload.resumo.total_cartoes));
  assert.ok(Number.isInteger(dashboardPayload.resumo.total_agendamentos));
  assert.ok(Number.isInteger(dashboardPayload.resumo.total_funcionarios));
});

test('admin can edit card owner details and password', async () => {
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@clinica.com', senha: 'admin123' }),
  });

  const loginPayload = await loginResponse.json();
  assert.equal(loginResponse.status, 200);

  const cardsResponse = await fetch(`${baseUrl}/admin/cartoes`, {
    headers: { Authorization: `Bearer ${loginPayload.token}` },
  });
  const cardsPayload = await cardsResponse.json();
  assert.equal(cardsResponse.status, 200);
  assert.ok(cardsPayload.cartoes?.length);
  assert.ok(cardsPayload.cartoes[0].usuario_id);

  const card = cardsPayload.cartoes[0];
  const updateResponse = await fetch(`${baseUrl}/admin/cartoes/${card.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${loginPayload.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clienteNome: 'Cliente Atualizado',
      email: 'cliente-atualizado@example.com',
      senha: 'NovaSenha123',
      identificacao: 'EV-UPDATED',
      tipo: 'Individual',
      validade: '2030-12-31',
    }),
  });

  const updatePayload = await updateResponse.json();
  assert.equal(updateResponse.status, 200);
  assert.equal(updatePayload.cartao?.nome_cartao, 'EV-UPDATED');
  assert.equal(updatePayload.usuario?.nome, 'Cliente Atualizado');
  assert.equal(updatePayload.usuario?.email, 'cliente-atualizado@example.com');
});

test('admin can edit existing availability by removing and adding slots', async () => {
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@clinica.com', senha: 'admin123' }),
  });

  const loginPayload = await loginResponse.json();
  assert.equal(loginResponse.status, 200);

  const data = '2099-01-01';
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM agendas WHERE data_agenda = ?', [data], (err) => (err ? reject(err) : resolve()));
  });

  const createResponse = await fetch(`${baseUrl}/agendamentos/disponibilidades`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginPayload.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data,
      disponibilidadesPorMedico: [{ funcionario_id: 1, horarios: ['08:00', '09:00'] }],
    }),
  });
  assert.equal(createResponse.status, 201);

  const removeResponse = await fetch(`${baseUrl}/agendamentos/disponibilidades/${encodeURIComponent(data)}/remover-horarios`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginPayload.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ funcionario_id: 1, horarios: ['08:00'] }),
  });
  assert.equal(removeResponse.status, 200);

  const addResponse = await fetch(`${baseUrl}/agendamentos/disponibilidades`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginPayload.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data,
      disponibilidadesPorMedico: [{ funcionario_id: 1, horarios: ['10:00'] }],
    }),
  });
  assert.equal(addResponse.status, 201);

  const listResponse = await fetch(`${baseUrl}/agendamentos/disponibilidades?mes=2099-01`, {
    headers: { Authorization: `Bearer ${loginPayload.token}` },
  });
  const listPayload = await listResponse.json();

  assert.equal(listResponse.status, 200);
  const day = listPayload.disponibilidades?.find((item) => item.data === data);
  assert.ok(day);
  assert.deepEqual(day.horarios, ['09:00', '10:00']);
});

test('admin re-scheduling request creates a client-facing notification action', async () => {
  const adminLoginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@clinica.com', senha: 'admin123' }),
  });
  const adminLoginPayload = await adminLoginResponse.json();
  assert.equal(adminLoginResponse.status, 200);

  const clientLoginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke@example.com', senha: '123456' }),
  });
  const clientLoginPayload = await clientLoginResponse.json();
  assert.equal(clientLoginResponse.status, 200);

  const appointmentResponse = await fetch(`${baseUrl}/agendamentos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientLoginPayload.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tipo: 'CONSULTA',
      data: '2099-03-01',
      horario: '09:00',
      funcionario_id: 1,
    }),
  });
  const appointmentPayload = await appointmentResponse.json();
  assert.equal(appointmentResponse.status, 201);

  const createResponse = await fetch(`${baseUrl}/admin/agendamentos/${appointmentPayload.id}/solicitar-reagendamento`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminLoginPayload.token}` },
  });
  assert.equal(createResponse.status, 201);

  const noticesResponse = await fetch(`${baseUrl}/notificacoes`, {
    headers: { Authorization: `Bearer ${clientLoginPayload.token}` },
  });
  const noticesPayload = await noticesResponse.json();
  assert.equal(noticesResponse.status, 200);
  const latestNotice = noticesPayload.notificacoes?.[0];
  assert.ok(latestNotice);
  assert.match(latestNotice.mensagem, /Reagendar/i);
  assert.match(latestNotice.mensagem, /__REAGENDAR__/);
});

test('admin can mark appointment as attended and create satisfaction notification', async () => {
  const adminLoginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@clinica.com', senha: 'admin123' }),
  });
  const adminLoginPayload = await adminLoginResponse.json();
  assert.equal(adminLoginResponse.status, 200);

  const clientLoginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke@example.com', senha: '123456' }),
  });
  const clientLoginPayload = await clientLoginResponse.json();
  assert.equal(clientLoginResponse.status, 200);

  const appointmentResponse = await fetch(`${baseUrl}/agendamentos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clientLoginPayload.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tipo: 'CONSULTA',
      data: '2099-04-01',
      horario: '10:00',
      funcionario_id: 1,
    }),
  });
  const appointmentPayload = await appointmentResponse.json();
  assert.equal(appointmentResponse.status, 201);

  const markResponse = await fetch(`${baseUrl}/admin/agendamentos/${appointmentPayload.id}/compareceu`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminLoginPayload.token}` },
  });
  assert.equal(markResponse.status, 200);

  const noticesResponse = await fetch(`${baseUrl}/notificacoes`, {
    headers: { Authorization: `Bearer ${clientLoginPayload.token}` },
  });
  const noticesPayload = await noticesResponse.json();
  assert.equal(noticesResponse.status, 200);
  const satisfactionNotice = (noticesPayload.notificacoes || []).find((notice) => /pesquisa de satisfação|pesquisa de satisfacao/i.test(notice.mensagem));
  assert.ok(satisfactionNotice, 'Expected a satisfaction survey notification after marking attendance');
});
