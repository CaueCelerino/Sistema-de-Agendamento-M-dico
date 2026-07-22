// Simple end-to-end smoke test against the mock API
(async () => {
  try {
    const base = 'http://localhost:3000/api';

    console.log('POST /auth/login');
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'smoke@example.com' })
    });
    const login = await loginRes.json();
    console.log('login:', login);
    const token = login.token;

    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    console.log('GET /cartoes');
    const cartoes = await (await fetch(`${base}/cartoes`, { headers: authHeaders })).json();
    console.log('cartoes:', cartoes);

    console.log('GET /agendamentos');
    const agendamentos = await (await fetch(`${base}/agendamentos`, { headers: authHeaders })).json();
    console.log('agendamentos:', agendamentos);

    console.log('GET /usuarios/me');
    const me = await (await fetch(`${base}/usuarios/me`, { headers: authHeaders })).json();
    console.log('me:', me);

    console.log('PUT /usuarios/me (update nome)');
    const updated = await (await fetch(`${base}/usuarios/me`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ nome: 'Smoke Tester' })
    })).json();
    console.log('updated:', updated);

    console.log('\nE2E smoke test completed successfully');
  } catch (err) {
    console.error('E2E smoke test failed:', err);
    process.exit(1);
  }
})();
