const db = require('../config/db');

function listarCartoes(req, res, next) {
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
    ORDER BY c.data_entrada DESC
  `;

  db.all(query, [], (err, rows) => {
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
      telefone: row.usuario_telefone,
      email: row.usuario_email,
      nome: row.usuario_nome
    }));

    res.json({ cartoes });
  });
}

module.exports = {
  listarCartoes,
};
