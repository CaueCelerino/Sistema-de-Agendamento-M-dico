const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { normalizeRole } = require('../utils/authz');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'clinica-5m-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'espacovida@gmail.com').toLowerCase();

function signToken(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
      role: normalizeRole(usuario.role),
      email: usuario.email,
      staffAccess: Boolean(usuario.staffAccess),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    role: normalizeRole(usuario.role),
    staffAccess: Boolean(usuario.staffAccess),
  };
}

router.post('/login', (req, res, next) => {
  const { email } = req.body || {};
  const senha = typeof req.body?.senha === 'string' ? req.body.senha : req.body?.password;

  if (!email || !senha) {
    return res.status(400).json({ error: 'email e senha são obrigatórios' });
  }

  db.get('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)', [email], async (err, row) => {
    if (err) return next(err);

    if (!row) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    let isValid = false;
    if (row.senha) {
      try {
        isValid = await bcrypt.compare(String(senha), row.senha);
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    db.get(
      'SELECT id FROM funcionarios WHERE LOWER(email) = LOWER(?) AND ativo = 1 LIMIT 1',
      [row.email],
      (funcErr, funcionarioRow) => {
        if (funcErr) return next(funcErr);

        const usuario = sanitizeUsuario({
          ...row,
          staffAccess: Boolean(funcionarioRow?.id),
        });

        const token = signToken(usuario);
        return res.json({ token, usuario, user: usuario });
      }
    );
  });
});

router.post('/register', async (req, res, next) => {
  const { email, nome, telefone } = req.body || {};
  const senha = typeof req.body?.senha === 'string' ? req.body.senha : req.body?.password;

  if (!email || !senha || !nome) {
    return res.status(400).json({ error: 'email, senha e nome são obrigatórios' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'email inválido' });
  }

  if (String(senha).length < 6) {
    return res.status(400).json({ error: 'senha deve ter pelo menos 6 caracteres' });
  }

  if (normalizedEmail === ADMIN_EMAIL) {
    return res.status(403).json({ error: 'email reservado para administração' });
  }

  try {
    const senhaHash = await bcrypt.hash(String(senha), 10);

    db.run(
      'INSERT INTO usuarios (email, senha, nome, telefone, role) VALUES (?, ?, ?, ?, ?)',
      [normalizedEmail, senhaHash, nome, telefone || null, 'USER'],
      function insertUser(err) {
        if (err) {
          if (String(err.message).includes('UNIQUE')) {
            return res.status(409).json({ error: 'Email já cadastrado' });
          }

          return next(err);
        }

        const usuario = sanitizeUsuario({
          id: this.lastID,
          nome,
          email: normalizedEmail,
          telefone: telefone || null,
          role: 'USER',
          staffAccess: false,
        });

        const token = signToken(usuario);
        return res.status(201).json({ token, usuario, user: usuario });
      }
    );
  } catch (hashErr) {
    return next(hashErr);
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Sessão encerrada com sucesso' });
});

module.exports = router;
