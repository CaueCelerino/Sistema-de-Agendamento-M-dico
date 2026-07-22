const express = require('express');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { normalizeRole } = require('../utils/authz');

const router = express.Router();

function sanitizeUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    role: normalizeRole(usuario.role),
  };
}

router.get('/me', (req, res, next) => {
  db.get('SELECT * FROM usuarios WHERE id = ?', [req.auth.userId], (err, row) => {
    if (err) return next(err);
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });

    return res.json({ usuario: sanitizeUsuario(row) });
  });
});

router.put('/me', (req, res, next) => {
  const { nome, telefone } = req.body || {};

  db.run(
    'UPDATE usuarios SET nome = COALESCE(?, nome), telefone = COALESCE(?, telefone), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [nome || null, telefone || null, req.auth.userId],
    function updateUser(err) {
      if (err) return next(err);
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      db.get('SELECT * FROM usuarios WHERE id = ?', [req.auth.userId], (findErr, row) => {
        if (findErr) return next(findErr);
        return res.json({ usuario: sanitizeUsuario(row) });
      });
    }
  );
});

router.put('/me/senha', async (req, res, next) => {
  const { senhaAtual, novaSenha } = req.body || {};

  if (!novaSenha) {
    return res.status(400).json({ error: 'novaSenha é obrigatória' });
  }

  db.get('SELECT * FROM usuarios WHERE id = ?', [req.auth.userId], async (err, row) => {
    if (err) return next(err);
    if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });

    // If senhaAtual provided, verify it. Otherwise reject for security.
    if (!senhaAtual) {
      return res.status(400).json({ error: 'senhaAtual é obrigatória para alterar a senha' });
    }

    try {
      const match = row.senha ? await bcrypt.compare(String(senhaAtual), row.senha) : false;
      if (!match) return res.status(401).json({ error: 'Senha atual inválida' });

      const hash = await bcrypt.hash(String(novaSenha), 10);
      db.run('UPDATE usuarios SET senha = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, req.auth.userId], function updatePassword(err2) {
        if (err2) return next(err2);
        return res.json({ message: 'Senha alterada com sucesso' });
      });
    } catch (e) {
      return next(e);
    }
  });
});

module.exports = router;
