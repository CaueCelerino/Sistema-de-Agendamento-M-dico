// End-to-end smoke test against real API contract
(async () => {
  try {
    const base = 'http://localhost:3000/api';
    const email = `smoke_${Date.now()}@example.com`;
    const senha = '123456';

    function assertStatus(label, response, expected) {
      if (response.status !== expected) {
        throw new Error(`${label} retornou ${response.status}, esperado ${expected}`);
      }
    }

    console.log('POST /auth/register');
    const registerRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha, nome: 'Smoke Tester' }),
    });
    assertStatus('register', registerRes, 201);

    console.log('POST /auth/login');
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    assertStatus('login', loginRes, 200);
    const login = await loginRes.json();
    console.log('login:', login);
    const token = login.token;

    if (!token) {
      throw new Error('Token não retornado no login');
    }

    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    console.log('GET /cartoes');
    const cartoesRes = await fetch(`${base}/cartoes`, { headers: authHeaders });
    assertStatus('cartoes', cartoesRes, 200);
    const cartoes = await cartoesRes.json();
    console.log('cartoes:', cartoes);

    console.log('GET /agendamentos');
    const agendamentosRes = await fetch(`${base}/agendamentos`, { headers: authHeaders });
    assertStatus('agendamentos', agendamentosRes, 200);
    const agendamentos = await agendamentosRes.json();
    console.log('agendamentos:', agendamentos);

    console.log('GET /usuarios/me');
    const meRes = await fetch(`${base}/usuarios/me`, { headers: authHeaders });
    assertStatus('usuarios/me', meRes, 200);
    const me = await meRes.json();
    console.log('me:', me);

    console.log('PUT /usuarios/me (update nome)');
    const updatedRes = await fetch(`${base}/usuarios/me`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ nome: 'Smoke Tester' })
    });
    assertStatus('usuarios/me update', updatedRes, 200);
    const updated = await updatedRes.json();
    console.log('updated:', updated);

    console.log('\nE2E smoke test completed successfully');
  } catch (err) {
    console.error('E2E smoke test failed:', err);
    process.exit(1);
  }
})();
