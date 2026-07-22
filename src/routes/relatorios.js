const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/cliente', (req, res, next) => {
  db.all(
    `SELECT id, titulo, conteudo, tipo, visibilidade, autor, publicado_em AS publicadoEm, created_at, updated_at
     FROM relatorios
     WHERE ativo = 1 AND visibilidade = 'CLIENTES'
     ORDER BY publicado_em DESC, id DESC`,
    [],
    (err, rows) => {
      if (err) return next(err);
      return res.json({ relatorios: rows || [] });
    }
  );
});

module.exports = router;
