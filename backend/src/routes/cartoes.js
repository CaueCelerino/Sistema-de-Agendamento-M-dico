const express = require('express');
const db = require('../config/db');
const { isAdminRole } = require('../utils/authz');

const router = express.Router();

function calculateDaysRemaining(dataSaida) {
  if (!dataSaida) return null;

  const today = new Date();
  const expiry = new Date(dataSaida);
  const diffMs = expiry.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

router.get('/', (req, res, next) => {
  const admin = isAdminRole(req.auth.role);

  const query = `
    SELECT
      c.id,
      c.usuario_id,
      c.tipo_servico,
      c.nome_cartao,
      c.data_entrada,
      c.data_saida,
      c.status,
      u.nome AS usuario_nome,
      u.telefone AS usuario_telefone,
      u.email AS usuario_email
    FROM cartoes c
    LEFT JOIN usuarios u ON u.id = c.usuario_id
    ${admin ? '' : 'WHERE c.usuario_id = ?'}
    ORDER BY c.data_entrada DESC
  `;

  const params = admin ? [] : [req.auth.userId];

  db.all(query, params, (err, rows) => {
    if (err) {
      return next(err);
    }

    const cartoes = rows.map((row) => ({
      id: row.id,
      usuario_id: row.usuario_id,
      tipo_servico: row.tipo_servico,
      nome_cartao: row.nome_cartao,
      data_entrada: row.data_entrada,
      data_saida: row.data_saida,
      status: row.status,
      dias_restantes: calculateDaysRemaining(row.data_saida),
      telefone: row.usuario_telefone,
      email: row.usuario_email,
      nome: row.usuario_nome,
    }));

    if (!admin && cartoes.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const expiry = future.toISOString().split('T')[0];

      return db.run(
        'INSERT INTO cartoes (usuario_id, tipo_servico, nome_cartao, data_entrada, data_saida, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.auth.userId, 'INDIVIDUAL', 'Cartão de Acesso', today, expiry, 'ATIVO'],
        function insertCard(insertErr) {
          if (insertErr) return next(insertErr);
          return res.json({
            cartoes: [{
              id: this.lastID,
              usuario_id: req.auth.userId,
              tipo_servico: 'INDIVIDUAL',
              nome_cartao: 'Cartão de Acesso',
              data_entrada: today,
              data_saida: expiry,
              status: 'ATIVO',
              dias_restantes: calculateDaysRemaining(expiry),
              telefone: null,
              email: null,
              nome: null,
            }],
          });
        }
      );
    }

    return res.json({ cartoes });
  });
});

module.exports = router;
