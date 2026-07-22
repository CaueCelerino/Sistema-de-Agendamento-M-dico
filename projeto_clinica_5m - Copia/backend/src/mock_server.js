const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory mock data
let mockUser = {
  id: 1,
  nome: 'Caue Silva',
  telefone: '+55 11 99999-0000',
  email: 'caue@example.com',
  role: 'ADM'
};

function normalizeRole(role) {
  if (!role) return 'USER';

  const upper = String(role).trim().toUpperCase();
  if (upper === 'ADMIN') return 'ADM';
  if (upper === 'SUPERADMIN' || upper === 'SUPER-ADM') return 'SUPER_ADM';
  if (upper === 'ADM' || upper === 'SUPER_ADM' || upper === 'USER') return upper;

  return 'USER';
}

function roleFromLoginInput(email, perfil) {
  const normalizedPerfil = normalizeRole(perfil);
  if (normalizedPerfil !== 'USER') return normalizedPerfil;

  const lowerEmail = String(email || '').toLowerCase();
  if (lowerEmail.includes('super')) return 'SUPER_ADM';
  if (lowerEmail.includes('admin')) return 'ADM';
  return 'USER';
}

function parseAuthRole(req) {
  const authHeader = req.headers.authorization || '';
  const [, token = ''] = authHeader.split(' ');
  const parts = token.split(':');
  if (parts.length < 3) return null;
  return normalizeRole(parts[1]);
}

function requireAuth(req, res, next) {
  const role = parseAuthRole(req);
  if (!role) {
    return res.status(401).json({ message: 'Token ausente ou inválido' });
  }

  req.auth = { role };
  next();
}

function requireAdmin(req, res, next) {
  const role = req.auth?.role || parseAuthRole(req);
  if (!role || (role !== 'ADM' && role !== 'SUPER_ADM')) {
    return res.status(403).json({ message: 'Acesso restrito a administradores' });
  }

  next();
}

const mockCartoes = [
  { id: 1, descricao: 'Cartão Básico', ativo: true, vencimento: '2026-12-31' },
  { id: 2, descricao: 'Cartão Premium', ativo: false, vencimento: '2023-06-30' }
];

const mockAgendamentos = [
  { id: 1, paciente: 'João', data: new Date().toISOString(), status: 'confirmado' },
  { id: 2, paciente: 'Maria', data: new Date(Date.now()+86400000).toISOString(), status: 'pendente' }
];

let mockFuncionarios = [
  { id: 1, nome: 'Dr. Carlos', email: 'carlos@example.com', role: 'medico', especialidade: 'Cardiologia' },
  { id: 2, nome: 'Enfermeira Ana', email: 'ana@example.com', role: 'enfermeiro', especialidade: 'Geral' },
  { id: 3, nome: 'Recepcionista Pedro', email: 'pedro@example.com', role: 'recepcionista', especialidade: 'Recepção' }
];

// Simple auth: accept any email/password and return a token
app.post('/api/auth/login', (req, res) => {
  const { email, perfil } = req.body;
  if (!email) return res.status(400).json({ message: 'email required' });

  const role = roleFromLoginInput(email, perfil);
  const usuario = { ...mockUser, email, role };
  const token = `mock:${role}:${usuario.id}`;

  return res.json({ token, usuario, user: usuario });
});

app.post('/api/auth/register', (req, res) => {
  const { email, nome } = req.body;
  if (!email || !nome) return res.status(400).json({ message: 'email and nome required' });
  mockUser = { ...mockUser, email, nome, role: 'USER' };
  return res.status(201).json({ usuario: mockUser, user: mockUser });
});

app.get('/api/cartoes', requireAuth, (req, res) => {
  return res.json(mockCartoes);
});

app.get('/api/agendamentos', requireAuth, (req, res) => {
  return res.json(mockAgendamentos);
});

app.get('/api/usuarios/me', requireAuth, (req, res) => {
  // simple auth simulation
  return res.json({ usuario: { ...mockUser, role: req.auth.role } });
});

app.put('/api/usuarios/me', requireAuth, (req, res) => {
  const changes = req.body || {};
  mockUser = { ...mockUser, ...changes, role: req.auth.role };
  return res.json({ usuario: mockUser });
});

// Admin endpoints
app.get('/api/admin/funcionarios', requireAuth, requireAdmin, (req, res) => {
  return res.json({ funcionarios: mockFuncionarios });
});

app.post('/api/admin/funcionarios', requireAuth, requireAdmin, (req, res) => {
  const { nome, email, role, especialidade } = req.body;
  if (!nome || !email) return res.status(400).json({ message: 'nome and email required' });
  const newFuncionario = {
    id: Math.max(...mockFuncionarios.map(f => f.id), 0) + 1,
    nome,
    email,
    role: role || 'funcionario',
    especialidade: especialidade || 'N/A'
  };
  mockFuncionarios.push(newFuncionario);
  return res.status(201).json(newFuncionario);
});

app.put('/api/admin/funcionarios/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const changes = req.body || {};
  const idx = mockFuncionarios.findIndex(f => f.id === parseInt(id));
  if (idx === -1) return res.status(404).json({ message: 'Funcionário não encontrado' });
  mockFuncionarios[idx] = { ...mockFuncionarios[idx], ...changes };
  return res.json(mockFuncionarios[idx]);
});

app.delete('/api/admin/funcionarios/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const idx = mockFuncionarios.findIndex(f => f.id === parseInt(id));
  if (idx === -1) return res.status(404).json({ message: 'Funcionário não encontrado' });
  const deleted = mockFuncionarios.splice(idx, 1)[0];
  return res.json({ message: 'Deletado', funcionario: deleted });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', mock: true }));

app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
