const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { inferRoleByEmail, normalizeRole } = require('../utils/authz');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'clinica-5m-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function signToken(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
      role: normalizeRole(usuario.role),
      email: usuario.email,
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
  };
}

router.post('/login', (req, res, next) => {
  const { email, senha } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'email é obrigatório' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, row) => {
    if (err) return next(err);

    if (!row) {
      const role = inferRoleByEmail(email);
      const nomePadrao = String(email).split('@')[0] || 'Novo Usuário';
      const senhaPadrao = String(senha || '123456');

      try {
        const senhaHash = await bcrypt.hash(senhaPadrao, 10);

        db.run(
          'INSERT INTO usuarios (email, senha, nome, role) VALUES (?, ?, ?, ?)',
          [email, senhaHash, nomePadrao, role],
          function insertUser(insertErr) {
            if (insertErr) return next(insertErr);

            const usuario = sanitizeUsuario({
              id: this.lastID,
              nome: nomePadrao,
              email,
              telefone: null,
              role,
            });

            const token = signToken(usuario);
            return res.json({ token, usuario, user: usuario });
          }
        );
      } catch (hashErr) {
        return next(hashErr);
      }

      return;
    }

    let isValid = true;
    if (senha && row.senha) {
      try {
        isValid = await bcrypt.compare(String(senha), row.senha);
      } catch {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const usuario = sanitizeUsuario(row);
    const token = signToken(usuario);
    return res.json({ token, usuario, user: usuario });
  });
});

router.post('/register', async (req, res, next) => {
  const { email, senha, nome, telefone } = req.body || {};

  if (!email || !senha || !nome) {
    return res.status(400).json({ error: 'email, senha e nome são obrigatórios' });
  }

  try {
    const senhaHash = await bcrypt.hash(String(senha), 10);

    db.run(
      'INSERT INTO usuarios (email, senha, nome, telefone, role) VALUES (?, ?, ?, ?, ?)',
      [email, senhaHash, nome, telefone || null, 'USER'],
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
          email,
          telefone: telefone || null,
          role: 'USER',
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
